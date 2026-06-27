/**
 * Chatbot Configuration
 * Configure all API endpoints, socket URLs, and feature flags here
 */

export const chatbotConfig = {
  // API Base URL - Change this to your backend API
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || import.meta.env.REACT_APP_API_BASE_URL || 'http://localhost:3000',

  // Socket.IO URL - Change this to your socket server
  socketUrl: import.meta.env.VITE_SOCKET_URL || import.meta.env.REACT_APP_SOCKET_URL || 'http://localhost:3000',

  // API Endpoints
  endpoints: {
    chatbot: '/api/chatbot',
    messages: '/api/chatbot/messages',
    uploadImage: '/api/chatbot/upload-image',
    complaint: '/api/chatbot/complaint',
    unread: '/api/chatbot/unread',
    markRead: '/api/chatbot/mark-read',
    migrate: '/api/chatbot/migrate',
  },

  // Feature Flags
  features: {
    enableSocket: true,
    enableComplaint: true,
    enableImageUpload: true,
    enableAnonymousUsers: true,
    enableUnreadCount: true,
  },

  // Image Upload Settings
  imageUpload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    maxImages: 5, // Max images per complaint
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif'],
  },

  // Storage Keys
  storageKeys: {
    authToken: 'authToken',
    sessionId: 'chatbot_session_id',
    anonymousUserId: 'chatbot_anonymous_user_id',
    position: 'chatbot_position',
  },

  // UI Configuration
  ui: {
    primaryColor: '#10b981', // Emerald green
    robotImage: '/robot-chat.png', // Path to robot image
    showQuickQuestions: true,
    draggable: true,
    defaultPosition: { x: 0, y: 0 }, // Will be set to bottom-right
  },
};

