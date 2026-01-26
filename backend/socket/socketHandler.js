const db = require('../database/db');

module.exports = (io) => {
    // Store active connections
    const activeUsers = new Map();

    io.on('connection', (socket) => {
        console.log(`✅ New socket connection: ${socket.id}`);

        // Join conversation room
        socket.on('join_conversation', async (data) => {
            try {
                const { session_id, user_id } = data;

                if (!session_id) {
                    socket.emit('error', { message: 'session_id is required' });
                    return;
                }

                socket.join(session_id);
                activeUsers.set(socket.id, { session_id, user_id });

                console.log(`User joined conversation: ${session_id}`);

                socket.emit('joined_conversation', {
                    session_id,
                    message: 'Successfully joined conversation'
                });
            } catch (error) {
                console.error('Error joining conversation:', error);
                socket.emit('error', { message: 'Failed to join conversation' });
            }
        });

        // Subscribe to specific conversation
        socket.on('subscribe_conversation', (data) => {
            const { conversation_id } = data;
            if (conversation_id) {
                socket.join(`conversation_${conversation_id}`);
                console.log(`Socket ${socket.id} subscribed to conversation ${conversation_id}`);
            }
        });

        // Handle new user message
        socket.on('new_message', async (data) => {
            try {
                const { session_id, message, sender, user_id, image_urls } = data;

                if (!session_id || !message || !sender) {
                    socket.emit('error', { message: 'Missing required fields' });
                    return;
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

                // Save message to database
                const result = await db.query(
                    `INSERT INTO messages (conversation_id, session_id, message, sender, user_id, image_urls, is_read)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
                    [conversationId, session_id, message, sender, user_id || null, image_urls || null, sender === 'bot']
                );

                const savedMessage = result.rows[0];

                // Broadcast to all clients in the conversation room
                io.to(session_id).emit('message_received', savedMessage);

                // Notify admins if it's a user message
                if (sender === 'user') {
                    io.to('admin_room').emit('new_user_message', {
                        conversation_id: conversationId,
                        session_id,
                        message: savedMessage
                    });
                }

                console.log(`Message saved and broadcast: ${session_id}`);
            } catch (error) {
                console.error('Error handling new message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle bot message
        socket.on('bot_message', async (data) => {
            try {
                const { session_id, message, user_id } = data;

                if (!session_id || !message) {
                    socket.emit('error', { message: 'Missing required fields' });
                    return;
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

                // Save bot message
                const result = await db.query(
                    `INSERT INTO messages (conversation_id, session_id, message, sender, is_read)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
                    [conversationId, session_id, message, 'bot', true]
                );

                const savedMessage = result.rows[0];

                // Broadcast to conversation room
                io.to(session_id).emit('message_received', savedMessage);

                console.log(`Bot message saved and broadcast: ${session_id}`);
            } catch (error) {
                console.error('Error handling bot message:', error);
                socket.emit('error', { message: 'Failed to send bot message' });
            }
        });

        // Leave conversation
        socket.on('leave_conversation', (data) => {
            const { session_id } = data;
            if (session_id) {
                socket.leave(session_id);
                console.log(`User left conversation: ${session_id}`);
            }
        });

        // Admin joins admin room
        socket.on('admin_join', () => {
            socket.join('admin_room');
            console.log(`Admin joined: ${socket.id}`);
        });

        // Admin leaves admin room
        socket.on('admin_leave', () => {
            socket.leave('admin_room');
            console.log(`Admin left: ${socket.id}`);
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            const userData = activeUsers.get(socket.id);
            if (userData) {
                console.log(`User disconnected from conversation: ${userData.session_id}`);
                activeUsers.delete(socket.id);
            }
            console.log(`Socket disconnected: ${socket.id}`);
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    console.log('✅ Socket.IO handlers initialized');
};
