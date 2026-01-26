# Chatbot Backend Server

Node.js backend server for the chatbot application with Socket.IO real-time messaging and PostgreSQL database.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Configure .env file (update PostgreSQL credentials)
# See .env file for all configuration options

# Create database
createdb chatbot_db

# Start server
npm start
```

## 📋 Requirements

- **Node.js** 16+ 
- **PostgreSQL** 12+
- **npm** or **yarn**

## 🔧 Configuration

Edit `.env` file to configure:

```env
# Server
PORT=3000
SOCKET_PORT=4001
NODE_ENV=development

# Database
DB_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=chatbot_db

# Security
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# File Uploads
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif
```

## 📁 Project Structure

```
backend/
├── controllers/
│   ├── chatbotController.js    # Message handling, FAQ responses
│   └── complaintController.js  # Complaint submission
├── database/
│   └── db.js                   # PostgreSQL connection & schema
├── routes/
│   └── chatbot.js              # API route definitions
├── socket/
│   └── socketHandler.js        # Socket.IO event handlers
├── uploads/                    # Image upload directory
├── .env                        # Environment variables
├── server.js                   # Main server entry point
└── package.json
```

## 🗄️ Database Schema

The database tables are created automatically on first run.

### Tables:

**conversations**
- `id` (SERIAL PRIMARY KEY)
- `session_id` (VARCHAR UNIQUE)
- `user_id` (INTEGER)
- `created_at`, `updated_at` (TIMESTAMP)

**messages**
- `id` (SERIAL PRIMARY KEY)
- `conversation_id` (INTEGER FK)
- `session_id` (VARCHAR)
- `message` (TEXT)
- `sender` (VARCHAR)
- `user_id` (INTEGER)
- `image_urls` (TEXT[])
- `is_read` (BOOLEAN)
- `created_at` (TIMESTAMP)

**complaints**
- `id` (SERIAL PRIMARY KEY)
- `ticket_id` (VARCHAR UNIQUE)
- `user_id` (INTEGER)
- `complaint_title` (VARCHAR)
- `complaint_description` (TEXT)
- `transaction_hash` (VARCHAR)
- `image_urls` (TEXT[])
- `status` (VARCHAR)
- `created_at`, `updated_at` (TIMESTAMP)

## 🔌 API Endpoints

### Chatbot
- `POST /api/chatbot` - Get bot response
- `POST /api/chatbot/messages` - Save/get messages
- `POST /api/chatbot/upload-image` - Upload images
- `POST /api/chatbot/unread` - Get unread count
- `POST /api/chatbot/mark-read` - Mark as read

### Complaints
- `POST /api/chatbot/complaint` - Submit/get complaints

### Health
- `GET /health` - Server health check

## 🔄 Socket.IO Events

### Client → Server
- `join_conversation` - Join a conversation room
- `subscribe_conversation` - Subscribe to conversation updates
- `new_message` - Send new user message
- `bot_message` - Send bot message
- `leave_conversation` - Leave conversation
- `admin_join` - Admin joins admin room
- `admin_leave` - Admin leaves admin room

### Server → Client
- `message_received` - New message broadcast
- `joined_conversation` - Confirmation of joining
- `new_user_message` - Admin notification
- `error` - Error notification

## 🛠️ Development

```bash
# Run with nodemon (auto-restart)
npm run dev

# Run normally
npm start
```

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 3000 |
| `SOCKET_PORT` | Socket.IO server port | 4001 |
| `NODE_ENV` | Environment | development |
| `POSTGRES_HOST` | PostgreSQL host | localhost |
| `POSTGRES_PORT` | PostgreSQL port | 5432 |
| `POSTGRES_USER` | Database user | postgres |
| `POSTGRES_PASSWORD` | Database password | - |
| `POSTGRES_DATABASE` | Database name | chatbot_db |
| `JWT_SECRET` | JWT secret key | - |
| `CORS_ORIGIN` | Allowed origins | localhost:5173 |
| `UPLOAD_DIR` | Upload directory | uploads |
| `MAX_FILE_SIZE` | Max file size (bytes) | 5242880 |

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin protection
- **Rate Limiting** - Request throttling
- **File Validation** - Upload restrictions
- **Input Sanitization** - SQL injection prevention

## 📦 Dependencies

- `express` - Web framework
- `socket.io` - Real-time communication
- `pg` - PostgreSQL client
- `multer` - File upload handling
- `cors` - CORS middleware
- `helmet` - Security headers
- `compression` - Response compression
- `morgan` - HTTP logging
- `dotenv` - Environment variables
- `jsonwebtoken` - JWT handling
- `bcryptjs` - Password hashing
- `express-rate-limit` - Rate limiting

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Make sure PostgreSQL is running and credentials in `.env` are correct.

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Change `PORT` in `.env` or kill the process using that port.

### Socket.IO Not Connecting
**Solution**: 
- Check `SOCKET_PORT` in `.env`
- Verify CORS settings
- Ensure frontend is using correct socket URL

## 📄 License

MIT
