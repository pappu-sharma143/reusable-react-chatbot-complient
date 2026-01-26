const db = require('../database/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for complaint images
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'complaint-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
    }
}).array('images', 5);

// Handle complaint submission or retrieval
exports.handleComplaint = async (req, res) => {
    try {
        // Check if this is a GET request (retrieve complaints)
        const isGettingComplaints = !req.body.complaint_title && !req.body.complaint_description;

        if (isGettingComplaints) {
            // Get user's complaints
            const { user_id } = req.body;

            let query = 'SELECT * FROM complaints';
            const params = [];

            if (user_id) {
                query += ' WHERE user_id = $1';
                params.push(user_id);
            }

            query += ' ORDER BY created_at DESC';

            const result = await db.query(query, params);

            return res.json({
                success: true,
                complaints: result.rows
            });
        }

        // Handle file upload if present
        upload(req, res, async (err) => {
            if (err) {
                console.error('Upload error:', err);
                return res.status(400).json({ error: err.message });
            }

            try {
                const {
                    user_id,
                    complaint_title,
                    complaint_description,
                    transaction_hash
                } = req.body;

                // Validation
                if (!complaint_title || !complaint_description) {
                    return res.status(400).json({
                        error: 'Complaint title and description are required'
                    });
                }

                // Check for duplicate complaints in last 24 hours
                if (user_id) {
                    const duplicateCheck = await db.query(
                        `SELECT * FROM complaints 
             WHERE user_id = $1 
             AND complaint_title = $2 
             AND created_at > NOW() - INTERVAL '24 hours'`,
                        [user_id, complaint_title]
                    );

                    if (duplicateCheck.rows.length > 0) {
                        return res.status(400).json({
                            error: 'You have already submitted a similar complaint in the last 24 hours'
                        });
                    }
                }

                // Generate ticket ID
                const ticketId = `TKT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

                // Get image URLs if uploaded
                const imageUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : null;

                // Insert complaint
                const result = await db.query(
                    `INSERT INTO complaints 
           (ticket_id, user_id, complaint_title, complaint_description, transaction_hash, image_urls, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
                    [
                        ticketId,
                        user_id || null,
                        complaint_title,
                        complaint_description,
                        transaction_hash || null,
                        imageUrls,
                        'pending'
                    ]
                );

                res.json({
                    success: true,
                    complaint: result.rows[0],
                    ticket_id: ticketId,
                    message: 'Complaint submitted successfully'
                });
            } catch (error) {
                console.error('Error submitting complaint:', error);
                res.status(500).json({ error: 'Failed to submit complaint' });
            }
        });
    } catch (error) {
        console.error('Error handling complaint:', error);
        res.status(500).json({ error: 'Failed to handle complaint' });
    }
};
