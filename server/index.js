const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
// Configure UI/Client origins
const io = new Server(server, {
  cors: {
    origin: "*", // Use specific origins in production
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Base Route
app.get('/', (req, res) => {
  res.send('Fitness Management System API Running');
});

const startServer = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // Try connecting to provided URI first
    try {
      console.log('🔄 Attempting Local MongoDB Connection...');
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
      console.log('✅ Connected to Local MongoDB');
    } catch (err) {
      console.warn('⚠️ Local MongoDB Failed. Starting Embedded Database...');
      // Fallback to Embedded Memory Server
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log(`📦 Embedded MongoDB Started at: ${mongoUri}`);

      await mongoose.connect(mongoUri);
      console.log('✅ Connected to Embedded Database');
    }

    // Track online users { userId -> socketId }
    const onlineUsers = {};

    io.on('connection', (socket) => {
      console.log(`⚡ Socket connected: ${socket.id}`);

      // Register user — join their personal room + community (so we can target rooms instead of broadcasting to all)
      socket.on('setup', (userData) => {
        const rawUid = userData?._id || userData?.id;
        if (rawUid) {
          const uid = rawUid.toString();
          socket.join(uid);
          socket.join('community'); // Everyone gets community messages via room
          if (['trainer', 'gymOwner', 'admin'].includes(userData?.role)) {
            socket.join('coaches_group');
          }
          socket.userId = uid;
          socket.userRole = userData?.role || 'member';
          onlineUsers[uid] = socket.id;
          io.emit('online_users', Object.keys(onlineUsers));
          socket.emit('connected');
        }
      });

      // Join community or a specific 1-on-1 room (optional; setup already joins community)
      socket.on('join_chat', (room) => {
        if (room) socket.join(room.toString());
      });

      // Handle new messages from client — normalize, persist, then emit only to correct room(s)
      socket.on('send_message', async (messageData) => {
        try {
          const Message = require('./models/Message');
          const mongoose = require('mongoose');
          const Booking = require('./models/Booking');
          const User = require('./models/User');

          // Trust socket setup identity first to avoid client id-shape mismatches (_id vs id)
          const senderRaw = socket.userId || messageData.sender;
          let senderId;
          try {
            senderId = senderRaw ? new mongoose.Types.ObjectId(senderRaw.toString()) : null;
          } catch (_) {
            return socket.emit('error', { message: 'Invalid sender' });
          }
          if (!senderId) return socket.emit('error', { message: 'Invalid sender' });

          let receiverValue = messageData.receiver;
          if (receiverValue === null || receiverValue === undefined || receiverValue === '') {
            receiverValue = 'community';
          }

          // Strict member chat policy:
          // - members cannot post in coaches_group
          // - members can DM only their assigned coach
          if (socket.userRole === 'member') {
            if (receiverValue === 'coaches_group') {
              return socket.emit('error', { message: 'Members cannot post in coaches group. Use your coach DM.' });
            }
            if (receiverValue !== 'community') {
              const senderUser = await User.findById(senderId).select('currentGym');
              const latestBooking = await Booking.findOne({
                member: senderId,
                status: { $ne: 'cancelled' }
              }).sort({ date: -1, createdAt: -1 });
              const targetUser = await User.findById(receiverValue).select('role currentGym');
              const isGymOwner = targetUser?.role === 'gymOwner';
              const canMessageGymOwner = isGymOwner
                && senderUser?.currentGym
                && targetUser?.currentGym
                && senderUser.currentGym.toString() === targetUser.currentGym.toString();
              if (!latestBooking?.coach) {
                if (canMessageGymOwner) {
                  // allow
                } else {
                  return socket.emit('error', { message: 'No assigned coach found for private chat.' });
                }
              }
              if (!canMessageGymOwner && latestBooking?.coach?.toString() !== receiverValue.toString()) {
                return socket.emit('error', { message: 'You can only chat with your assigned coach.' });
              }
            }
          }

          if (receiverValue !== 'community' && receiverValue !== 'coaches_group') {
            try {
              receiverValue = new mongoose.Types.ObjectId(receiverValue.toString());
            } catch (_) {
              return socket.emit('error', { message: 'Invalid receiver' });
            }
          }

          const toSave = {
            sender: senderId,
            receiver: receiverValue,
            content: messageData.content || '',
            mediaUrl: messageData.mediaUrl || '',
            mediaType: messageData.mediaType || 'none',
            isRead: false
          };

          let newMessage = await Message.create(toSave);
          newMessage = await newMessage.populate('sender', 'name profilePic role');
          const emitPayload = { ...newMessage.toObject(), tempId: messageData.tempId };

          if (receiverValue === 'community') {
            io.to('community').emit('receive_message', emitPayload);
          } else if (receiverValue === 'coaches_group') {
            io.to('coaches_group').emit('receive_message', emitPayload);
          } else {
            const receiverIdStr = receiverValue.toString();
            io.to(senderId.toString()).emit('receive_message', emitPayload);
            io.to(receiverIdStr).emit('receive_message', emitPayload);
          }
        } catch (error) {
          console.error('Socket send_message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Admin delete a message
      socket.on('delete_message', async ({ messageId, userId }) => {
        try {
          const User = require('./models/User');
          const Message = require('./models/Message');
          const adminUser = await User.findById(userId);
          if (!adminUser || adminUser.role !== 'admin') {
            return socket.emit('error', { message: 'Only admins can delete messages.' });
          }
          await Message.findByIdAndDelete(messageId);
          // Tell ALL clients to remove this message from their UI
          io.emit('message_deleted', messageId);
        } catch (error) {
          console.error('Delete message error:', error);
        }
      });

      socket.on('disconnect', () => {
        // Remove from online map
        for (const [uid, sid] of Object.entries(onlineUsers)) {
          if (sid === socket.id) {
            delete onlineUsers[uid];
            break;
          }
        }
        io.emit('online_users', Object.keys(onlineUsers));
      });
    });

    // Start Server only after DB connect
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Critical Database Error:', error);
  }
};

startServer();
