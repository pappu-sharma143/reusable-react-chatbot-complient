const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const chatbotController = require('../controllers/chatbotController');
const complaintController = require('../controllers/complaintController');

// Ensure uploads directory exists
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'chatbot-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/gif').split(',');
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880 // 5MB default
    }
});

// Chatbot routes
router.post('/chatbot', chatbotController.getBotResponse);
router.post('/chatbot/messages', chatbotController.getOrSaveMessages);
router.post('/chatbot/upload-image', upload.array('images', 5), chatbotController.uploadImages);
router.post('/chatbot/unread', chatbotController.getUnreadCount);
router.post('/chatbot/mark-read', chatbotController.markAsRead);

// Complaint routes
router.post('/chatbot/complaint', complaintController.handleComplaint);

module.exports = router;
