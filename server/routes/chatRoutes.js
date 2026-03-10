const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for chat media uploads
const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, 'uploads/'); // reusing existing uploads directory
    },
    filename(req, file, cb) {
        cb(null, `chat-${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({ storage });

router.get('/contacts', protect, chatController.getContacts);
router.get('/history/:targetId', protect, chatController.getChatHistory);
router.post('/upload', protect, upload.single('media'), chatController.uploadMedia);

// New Routes for Persistent Unread Notifications
router.get('/unread', protect, chatController.getUnreadCounts);
router.post('/read/:type/:id', protect, chatController.markChatRead);

module.exports = router;
