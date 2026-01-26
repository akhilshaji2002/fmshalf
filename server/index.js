const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();
// Force restart for env load (Key Updated)

const app = express();
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

    // Start Server only after DB connect
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Critical Database Error:', error);
  }
};

startServer();
