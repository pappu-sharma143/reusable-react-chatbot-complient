# Reusable Chatbot & Complaint System

A standalone, reusable React chatbot and complaint system with a complete Node.js backend. Features real-time messaging via Socket.IO, PostgreSQL database, image uploads, and complaint management.

## ⚡ Quick Start

```bash
# 1. Install dependencies
cd chatbot-react
npm install
cd backend
npm install

# 2. Setup PostgreSQL database
createdb chatbot_db

# 3. Configure backend/.env (update PostgreSQL password)
# POSTGRES_PASSWORD=your_password

# 4. Run both servers (in separate terminals)
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
cd backend
npm start
```

**Open**: `http://localhost:5173` - Chatbot should show "Online" status 🟢

## 🚀 Features

- **Real-time Chat**: Socket.IO integration for instant messaging with automatic reconnection
- **FAQ System**: Intelligent keyword matching with 96+ predefined responses
- **Image Upload**: Support for multiple images (max 5 per message/complaint)
- **Complaint System**: Full complaint submission with ticket generation (always accessible)
- **Anonymous Users**: Support for both logged-in and anonymous users
- **Unread Count**: Track unread messages
- **Draggable UI**: Floating chatbot button that can be dragged around (stays within viewport)
- **Mobile Responsive**: Works seamlessly on mobile and desktop
- **Configurable**: Easy configuration through config file
- **Graceful Degradation**: Works even if socket connection fails
- **Connection Status**: Real-time connection status display (Online/Offline/Connecting)
- **PostgreSQL Database**: Persistent message and complaint storage
- **Complete Backend**: Node.js + Express + Socket.IO server included


## 📦 Installation

### Frontend Installation

```bash
cd chatbot-react
npm install
```

### Backend Installation

```bash
cd chatbot-react/backend
npm install
```

### Database Setup

This project uses **PostgreSQL** as the database. Make sure you have PostgreSQL installed and running.

1. **Install PostgreSQL** (if not already installed):
   - Download from: https://www.postgresql.org/download/
   - Or use package manager: `brew install postgresql` (Mac) or `choco install postgresql` (Windows)

2. **Create Database**:
   ```sql
   CREATE DATABASE chatbot_db;
   ```

3. **Configure Database Connection**:
   - Edit `backend/.env` file
   - Update PostgreSQL credentials:
     ```env
     POSTGRES_HOST=localhost
     POSTGRES_PORT=5432
     POSTGRES_USER=postgres
     POSTGRES_PASSWORD=your_password
     POSTGRES_DATABASE=chatbot_db
     ```

4. **Database Tables**: Tables will be created automatically when you start the backend server for the first time.

## 🚀 Running the Application

You need to run **both** the frontend and backend servers:

### Option 1: Run in Separate Terminals

**Terminal 1 - Frontend (React):**
```bash
cd chatbot-react
npm run dev
```
Frontend will run on: `http://localhost:5173`

**Terminal 2 - Backend (Node.js + Socket.IO):**
```bash
cd chatbot-react/backend
npm start
```
Backend will run on:
- API Server: `http://localhost:3000`
- Socket.IO Server: `http://localhost:4001`

### Option 2: Run with Node (Development)

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd backend
node server.js
```

### Verify Servers are Running

1. **Frontend**: Open `http://localhost:5173` in your browser
2. **Backend API**: Check `http://localhost:3000/health` (should return `{"status":"ok"}`)
3. **Chatbot Status**: The chatbot should show "Online" status (green) when both servers are running

## ⚙️ Configuration

Edit `src/config/chatbotConfig.js` to configure:

```javascript
export const chatbotConfig = {
  // API Base URL - Change to your backend API
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.REACT_APP_API_BASE_URL || 'https://localhost',
  
  // Socket.IO URL - Change to your socket server
  socketUrl: import.meta.env.VITE_SOCKET_URL || import.meta.env.REACT_APP_SOCKET_URL || 'https://localhost:4001',
  
  // Feature Flags
  features: {
    enableSocket: true,        // Enable/disable Socket.IO real-time updates
    enableComplaint: true,     // Enable/disable complaint submission
    enableImageUpload: true,   // Enable/disable image uploads
    enableAnonymousUsers: true, // Enable/disable anonymous user support
    enableUnreadCount: true,   // Enable/disable unread message count
  },
  
  // Image Upload Settings
  imageUpload: {
    maxSize: 5 * 1024 * 1024, // 5MB per image
    maxImages: 5,              // Maximum images per message/complaint
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
  },
  
  // ... more configuration options
};
```

Or use environment variables (create `.env` file in project root):

```env
# Vite uses VITE_ prefix (recommended)
VITE_API_BASE_URL=https://your-api.com
VITE_SOCKET_URL=https://your-socket-server.com:4001

# Or use REACT_APP_ prefix for backward compatibility
REACT_APP_API_BASE_URL=https://your-api.com
REACT_APP_SOCKET_URL=https://your-socket-server.com:4001
```

**Note:** This project uses Vite, so environment variables should be prefixed with `VITE_`. The config also supports `REACT_APP_` prefix for backward compatibility.

## 🎯 Usage

### Basic Usage

```jsx
import Chatbot from './components/Chatbot';

function App() {
  return (
    <div>
      <h1>My App</h1>
      {/* Chatbot renders as floating button */}
      <Chatbot />
    </div>
  );
}
```

### Advanced Usage with Custom Props

```jsx
import Chatbot from './components/Chatbot';

function App() {
  const getAuthToken = () => {
    // Your custom token retrieval logic
    return localStorage.getItem('authToken');
  };

  const getUserInfo = () => {
    // Your custom user info retrieval logic
    const token = getAuthToken();
    if (token) {
      const decoded = jwtDecode(token);
      return {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
      };
    }
    return null;
  };

  const handleNavigate = (path) => {
    // Your custom navigation logic
    window.location.href = path;
  };

  return (
    <div>
      <h1>My App</h1>
      <Chatbot
        apiBaseUrl="https://your-api.com"
        socketUrl="https://your-socket-server.com:4001"
        getAuthToken={getAuthToken}
        getUserInfo={getUserInfo}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
```

## 📁 Project Structure

```
chatbot-react/
├── src/                          # Frontend source code
│   ├── components/
│   │   ├── Chatbot.jsx          # Main chatbot component
│   │   ├── ComplaintForm.jsx    # Complaint submission form
│   │   └── ui/                  # Reusable UI components
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Textarea.jsx
│   │       ├── Label.jsx
│   │       └── Card.jsx
│   ├── config/
│   │   └── chatbotConfig.js     # Configuration file
│   ├── data/
│   │   └── faqResponses.js      # FAQ responses and matching logic
│   ├── hooks/
│   │   └── useChatbotSocket.js  # Socket.IO hook
│   ├── services/
│   │   └── api.js               # API service layer
│   ├── utils/
│   │   ├── storage.js           # LocalStorage utility
│   │   └── cn.js                # Class name utility
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   └── index.css                # Global styles
├── backend/                      # Backend server
│   ├── controllers/
│   │   ├── chatbotController.js # Chatbot message handling
│   │   └── complaintController.js # Complaint handling
│   ├── database/
│   │   └── db.js                # PostgreSQL connection & setup
│   ├── routes/
│   │   └── chatbot.js           # API routes
│   ├── socket/
│   │   └── socketHandler.js     # Socket.IO event handlers
│   ├── uploads/                 # Image upload directory
│   ├── .env                     # Environment variables
│   ├── server.js                # Main server file
│   └── package.json             # Backend dependencies
├── package.json                  # Frontend dependencies
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🏗️ Backend Architecture

The backend is built with **Node.js**, **Express**, and **Socket.IO** for real-time communication.

### Key Components:

1. **`server.js`** - Main entry point
   - Sets up Express server (port 3000)
   - Sets up Socket.IO server (port 4001)
   - Configures middleware (CORS, helmet, compression, rate limiting)

2. **`database/db.js`** - Database layer
   - PostgreSQL connection pool
   - Auto-creates tables on startup (conversations, messages, complaints)
   - Provides query interface

3. **`controllers/`** - Business logic
   - `chatbotController.js`: Message handling, FAQ responses, image uploads
   - `complaintController.js`: Complaint submission and retrieval

4. **`routes/chatbot.js`** - API endpoints
   - Defines all REST API routes
   - Handles file upload middleware

5. **`socket/socketHandler.js`** - Real-time events
   - Manages Socket.IO connections
   - Handles message broadcasting
   - Room management for conversations

### Database Schema:

**conversations table:**
- `id`, `session_id`, `user_id`, `created_at`, `updated_at`

**messages table:**
- `id`, `conversation_id`, `session_id`, `message`, `sender`, `user_id`, `image_urls`, `is_read`, `created_at`

**complaints table:**
- `id`, `ticket_id`, `user_id`, `complaint_title`, `complaint_description`, `transaction_hash`, `image_urls`, `status`, `created_at`, `updated_at`


## 🔧 API Endpoints

The backend provides these endpoints (all implemented in `backend/routes/chatbot.js`):

### Chatbot Endpoints (ALL use POST method)
- `POST /api/chatbot` - Get bot response (body: `{ message: string }`)
- `POST /api/chatbot/messages` - Save or get messages
  - **Save**: `{ session_id, message, sender, user_id?, image_urls? }`
  - **Get**: `{ session_id }` (no message/sender)
- `POST /api/chatbot/upload-image` - Upload image(s) (FormData with `images` field, max 5 files)
- `POST /api/chatbot/unread` - Get unread count (body: `{ session_id?, user_id? }`)
- `POST /api/chatbot/mark-read` - Mark messages as read (body: `{ conversation_id }` or `{ session_id }`)

### Complaint Endpoints (ALL use POST method)
- `POST /api/chatbot/complaint` - Submit or get complaints
  - **Submit**: `{ complaint_title, complaint_description, user_id?, transaction_hash?, images? }`
  - **Get**: `{ user_id? }` (no title/description)

### Health Check
- `GET /health` - Server health check (returns `{ status: 'ok', timestamp }`)


## 🎨 Customization

### Styling

The component uses Tailwind CSS. You can customize colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#10b981', // Change to your brand color
        foreground: '#ffffff',
      },
    },
  },
}
```

### FAQ Responses

Edit `src/data/faqResponses.js` to add or modify FAQ responses.

## 📱 Features Breakdown

### Chatbot Features
- ✅ Real-time messaging via Socket.IO
- ✅ FAQ keyword matching
- ✅ Image upload (multiple images)
- ✅ Quick questions buttons
- ✅ Message history loading
- ✅ Anonymous user support
- ✅ Logged-in user support
- ✅ Unread message count
- ✅ Draggable floating button

### Complaint Features
- ✅ Complaint submission form (always visible - login required for submission)
- ✅ Image attachments (max 5 images)
- ✅ Transaction hash linking (optional)
- ✅ Ticket ID generation (format: `TKT-{timestamp}-{random}`)
- ✅ Duplicate prevention (24-hour window)
- ✅ Authentication required for submission
- ✅ Clear login prompt for anonymous users
- ✅ Form validation and error handling

## 🔐 Security

- JWT token validation
- Input sanitization
- File type and size validation
- XSS protection
- SQL injection prevention (handled by backend)

## 🚀 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Note:** Configure API URLs in `src/config/chatbotConfig.js` or `.env` file before running.

## 📝 Environment Variables

Create a `.env` file in the project root:

```env
# Vite environment variables (recommended - must be prefixed with VITE_)
VITE_API_BASE_URL=https://your-api.com
VITE_SOCKET_URL=https://your-socket-server.com:4001

# Backward compatibility (also supported)
REACT_APP_API_BASE_URL=https://your-api.com
REACT_APP_SOCKET_URL=https://your-socket-server.com:4001
```

**Important:** 
- Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client
- After changing `.env` file, restart the development server
- Environment variables are available via `import.meta.env.VITE_*`

## 🔌 Socket.IO Events

The component uses these Socket.IO events:

**Client → Server:**
- `join_conversation` - Join conversation room
- `subscribe_conversation` - Subscribe to specific conversation
- `new_message` - Send new user message
- `bot_message` - Send bot message
- `leave_conversation` - Leave conversation room
- `admin_join` - Admin joins admin room (admin only)
- `admin_leave` - Admin leaves admin room (admin only)

**Server → Client:**
- `message_received` - New message in conversation
- `connect` - Socket connected
- `disconnect` - Socket disconnected
- `new_user_message` - New user message notification (admin only)
- `conversation_updated` - Conversation activity update (admin only)

### Socket Connection Features

- **Automatic Reconnection**: Automatically attempts to reconnect if connection is lost
- **Transport Fallback**: Tries polling first, then websocket for better compatibility
- **Graceful Degradation**: App continues to work even if socket connection fails
- **Connection Status**: Shows "Online", "Offline", or "Connecting..." in the chatbot header
- **Detailed Logging**: Comprehensive console logging for debugging connection issues

### Troubleshooting Socket Connection

If the socket shows "Offline" status:

1. **Check Browser Console**: Open DevTools (F12) and look for socket connection errors
2. **Verify Socket Server**: Ensure your socket server is running and accessible
3. **Check CORS**: Ensure your socket server allows requests from your origin
4. **Test Connection**: Try accessing `https://your-socket-url:port/socket.io/?EIO=4&transport=polling` in browser
5. **Check URL Format**: 
   - Correct: `https://your-domain.com:4001`
   - Or: `https://your-domain.com` (if socket is on same port as API)
6. **Custom Path**: If your server uses a custom Socket.IO path, update the `path` option in `src/hooks/useChatbotSocket.js`
7. **Temporary Disable**: Set `enableSocket: false` in config to disable socket and use API polling only

## 📦 Dependencies

- `react` - React library
- `react-dom` - React DOM
- `socket.io-client` - Real-time communication
- `axios` - HTTP client
- `jwt-decode` - JWT token decoding
- `lucide-react` - Icons
- `clsx` - Class name utility
- `tailwind-merge` - Tailwind class merging

## 🎯 Integration Guide

### Step 1: Install Dependencies

```bash
npm install react react-dom socket.io-client axios jwt-decode lucide-react clsx tailwind-merge
npm install -D @vitejs/plugin-react vite tailwindcss postcss autoprefixer
```

### Step 2: Copy Files

Copy the entire `chatbot-react` folder to your project or use it as a standalone package.

### Step 3: Configure

1. Update `src/config/chatbotConfig.js` with your API URLs
2. Update `src/data/faqResponses.js` with your FAQ responses
3. Configure Tailwind CSS in your project
4. Create `.env` file with your API and socket URLs (optional)

### Step 4: Use Component

```jsx
import Chatbot from './chatbot-react/src/components/Chatbot';

function App() {
  return (
    <div>
      <YourAppContent />
      <Chatbot />
    </div>
  );
}
```

## 📋 Quick Reference

### Complaint Button
- **Location**: Always visible in the chatbot input area (⚠️ icon)
- **Visibility**: Always shown (not dependent on login status)
- **Login Required**: Yes, for actual submission (form shows warning if not logged in)
- **Access**: Click the ⚠️ icon in the input area to open complaint form

### Socket Connection Status
- **Online**: Green status, real-time updates working
- **Offline**: Red status, using API fallback mode
- **Connecting...**: Yellow status, attempting to connect

### Configuration Priority
1. Environment variables (`.env` file) - `VITE_*` or `REACT_APP_*`
2. Config file defaults (`src/config/chatbotConfig.js`)
3. Component props (if provided)

## 🔄 Migration from Next.js

This standalone version:
- ✅ Removed Next.js dependencies (`next/image`, `next/link`, `next/navigation`)
- ✅ Replaced with standard React/HTML equivalents
- ✅ Made all API calls configurable
- ✅ Removed project-specific dependencies
- ✅ Made it fully reusable and portable

## 📄 License

This is a reusable component extracted from the   project. Use it according to your project's license.

## 🐛 Troubleshooting

### Common Issues

#### 1. Socket Connection Not Working

**Symptoms:** Chatbot shows "Offline" status, no real-time updates

**Solutions:**
- Check browser console for detailed error messages
- Verify socket server is running and accessible
- Check CORS settings on socket server
- Try disabling socket temporarily: `enableSocket: false` in config
- Verify socket URL format is correct
- Check network tab for failed socket.io requests

#### 2. Complaint Button Not Visible

**Solution:** The complaint button (⚠️ icon) is always visible in the input area. If you don't see it:
- Ensure `enableComplaint: true` in config
- Check if the chatbot window is fully open
- Verify the button isn't hidden by CSS

#### 3. API Requests Failing

**Symptoms:** Network errors in browser console, messages not saving

**Solutions:**
- Verify API base URL is correct in config
- Check CORS settings on backend
- Ensure backend endpoints match expected format
- Check browser network tab for specific error codes
- Verify authentication token is valid (if required)

#### 4. Environment Variables Not Working

**Symptoms:** Config values not updating from `.env` file

**Solutions:**
- Ensure variables are prefixed with `VITE_` (for Vite)
- Restart development server after changing `.env`
- Check `.env` file is in project root
- Verify no typos in variable names

#### 5. Chatbot Going Out of Screen

**Solution:** This has been fixed! The chatbot now:
- Automatically stays within viewport boundaries
- Adjusts position on window resize
- Constrains dragging to visible area
- Handles both button and chat window sizes

### Debug Mode

Enable detailed logging by checking the browser console. The socket hook provides comprehensive logging:
- Connection attempts and status
- Error details with transport information
- Reconnection attempts
- Room joining events

## 🔄 Recent Updates

### v1.1.0 (Latest)
- ✅ Fixed socket connection with improved error handling
- ✅ Added comprehensive connection logging
- ✅ Complaint button now always visible
- ✅ Fixed chatbot viewport positioning
- ✅ Improved connection status display
- ✅ Added graceful fallback when socket fails
- ✅ Updated to use Vite environment variables
- ✅ Enhanced error messages and debugging

### v1.0.0
- ✅ Initial release
- ✅ Basic chatbot functionality
- ✅ Complaint system
- ✅ Socket.IO integration
- ✅ Image upload support

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify configuration in `src/config/chatbotConfig.js`
4. Check network tab for API/socket connection issues

---

**Note**: This is a standalone, reusable version. It does not interfere with the main project and can be used independently.

