require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const db = require('./database/db');
const chatbotRoutes = require('./routes/chatbot');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN.split(','),
        methods: ['GET', 'POST'],
        credentials: true
    },
    transports: ['polling', 'websocket'],
    allowEIO3: true
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use(limiter);

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Routes
app.use(process.env.API_PREFIX || '/api', chatbotRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
socketHandler(io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// Start server (both API and Socket.IO on the same server)
const PORT = process.env.PORT || 3000;

// Start the HTTP server with both Express app and Socket.IO
server.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📡 API and Socket.IO both available on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV}`);
    console.log(`🗄️  Database: ${process.env.DB_TYPE}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing servers...');
    server.close(() => {
        console.log('Servers closed');
        process.exit(0);
    });
});
