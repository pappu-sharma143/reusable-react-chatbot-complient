const db = require('../database/db');
const { v4: uuidv4 } = require('uuid');

// Get bot response (FAQ matching)
exports.getBotResponse = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Simple FAQ response logic
        const response = generateBotResponse(message);

        res.json({ response });
    } catch (error) {
        console.error('Error getting bot response:', error);
        res.status(500).json({ error: 'Failed to get bot response' });
    }
};

// Get or save messages
exports.getOrSaveMessages = async (req, res) => {
    try {
        const { session_id, message, sender, user_id, image_urls, action } = req.body;

        // If no action specified, determine based on presence of message
        const isGettingMessages = !message && !sender;

        if (isGettingMessages) {
            // Get messages for a conversation
            const result = await db.query(
                `SELECT m.*, c.session_id 
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.session_id = $1
         ORDER BY m.created_at ASC`,
                [session_id]
            );

            return res.json({ messages: result.rows });
        } else {
            // Save a new message
            if (!session_id || !message || !sender) {
                return res.status(400).json({ error: 'session_id, message, and sender are required' });
            }

            // Get or create conversation
            let conversation = await db.query(
                'SELECT * FROM conversations WHERE session_id = $1',
                [session_id]
            );

            if (conversation.rows.length === 0) {
                conversation = await db.query(
                    'INSERT INTO conversations (session_id, user_id) VALUES ($1, $2) RETURNING *',
                    [session_id, user_id || null]
                );
            }

            const conversationId = conversation.rows[0].id;

            // Save message
            const result = await db.query(
                `INSERT INTO messages (conversation_id, session_id, message, sender, user_id, image_urls, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
                [conversationId, session_id, message, sender, user_id || null, image_urls || null, sender === 'bot']
            );

            // Update conversation timestamp
            await db.query(
                'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [conversationId]
            );

            return res.json({
                success: true,
                message: result.rows[0],
                conversation_id: conversationId
            });
        }
    } catch (error) {
        console.error('Error handling messages:', error);
        res.status(500).json({ error: 'Failed to handle messages' });
    }
};

// Upload images
exports.uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No images uploaded' });
        }

        const imageUrls = req.files.map(file => `/uploads/${file.filename}`);

        res.json({
            success: true,
            imageUrls,
            count: imageUrls.length
        });
    } catch (error) {
        console.error('Error uploading images:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
    try {
        const { session_id, user_id } = req.body;

        let query = `
      SELECT COUNT(*) as unread_count
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.is_read = false AND m.sender = 'user'
    `;
        const params = [];

        if (session_id) {
            query += ` AND c.session_id = $1`;
            params.push(session_id);
        } else if (user_id) {
            query += ` AND c.user_id = $1`;
            params.push(user_id);
        }

        const result = await db.query(query, params);

        res.json({ unread_count: parseInt(result.rows[0].unread_count) });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
    try {
        const { conversation_id, session_id } = req.body;

        let query = 'UPDATE messages SET is_read = true WHERE ';
        const params = [];

        if (conversation_id) {
            query += 'conversation_id = $1';
            params.push(conversation_id);
        } else if (session_id) {
            query += `conversation_id IN (
        SELECT id FROM conversations WHERE session_id = $1
      )`;
            params.push(session_id);
        } else {
            return res.status(400).json({ error: 'conversation_id or session_id required' });
        }

        await db.query(query, params);

        res.json({ success: true });
    } catch (error) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

// Simple bot response generator
function generateBotResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Basic FAQ responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return 'Hello! How can I help you today?';
    }
    if (lowerMessage.includes('help')) {
        return 'I\'m here to help! You can ask me about our services, trading plans, withdrawals, or submit a complaint if you need assistance.';
    }
    if (lowerMessage.includes('sign up') || lowerMessage.includes('register')) {
        return 'To sign up, click on the "Sign Up" button on the homepage and fill in your details. You\'ll receive a confirmation email to verify your account.';
    }
    if (lowerMessage.includes('trading plan')) {
        return 'We offer various trading plans to suit your needs. You can view all available plans in the "Trading Plans" section of your dashboard.';
    }
    if (lowerMessage.includes('withdraw')) {
        return 'To withdraw funds, go to your dashboard and click on "Withdraw Funds". Follow the instructions to complete your withdrawal request.';
    }
    if (lowerMessage.includes('contact') || lowerMessage.includes('support')) {
        return 'You can contact our support team by submitting a complaint using the complaint button, or email us at support@example.com.';
    }

    // Default response
    return 'Thank you for your message. If you need specific assistance, please use the complaint form or contact our support team.';
}
