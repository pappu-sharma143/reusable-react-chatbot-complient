import axios from 'axios';
import { chatbotConfig } from '../config/chatbotConfig';
import secureStorage from '../utils/storage';

/**
 * API Service
 * Handles all API calls to the backend
 */

const api = axios.create({
  baseURL: chatbotConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = secureStorage.getItem(chatbotConfig.storageKeys.authToken);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const chatbotAPI = {
  // Get bot response
  getBotResponse: async (message) => {
    const response = await api.post(chatbotConfig.endpoints.chatbot, { message });
    return response.data;
  },

  // Save message
  saveMessage: async (data) => {
    const response = await api.post(chatbotConfig.endpoints.messages, data);
    return response.data;
  },

  // Get conversation messages
  getMessages: async (sessionId, userId = null) => {
    const body = { session_id: sessionId };
    if (userId) body.user_id = userId;
    const response = await api.post(chatbotConfig.endpoints.messages, body);
    return response.data;
  },

  // Upload image(s)
  uploadImage: async (files) => {
    const formData = new FormData();
    if (Array.isArray(files)) {
      files.forEach((file) => {
        formData.append('images', file);
      });
    } else {
      formData.append('image', files);
    }

    const token = secureStorage.getItem(chatbotConfig.storageKeys.authToken);
    const headers = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${chatbotConfig.apiBaseUrl}${chatbotConfig.endpoints.uploadImage}`,
      formData,
      { headers }
    );
    return response.data;
  },

  // Submit complaint
  submitComplaint: async (data) => {
    // Ensure complaint_image_urls is properly formatted as array
    const complaintData = {
      ...data,
      complaint_image_urls: data.complaint_image_urls && Array.isArray(data.complaint_image_urls) 
        ? data.complaint_image_urls 
        : data.complaint_image_urls 
          ? [data.complaint_image_urls] 
          : undefined,
    };
    const response = await api.post(chatbotConfig.endpoints.complaint, complaintData);
    return response.data;
  },

  // Get user complaints
  getComplaints: async () => {
    const response = await api.post(chatbotConfig.endpoints.complaint, {});
    return response.data;
  },

  // Get unread count
  getUnreadCount: async (sessionId, userId = null) => {
    const body = {};
    if (sessionId) body.session_id = sessionId;
    if (userId) body.user_id = userId;
    const response = await api.post(chatbotConfig.endpoints.unread, body);
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (conversationId) => {
    const response = await api.post(chatbotConfig.endpoints.markRead, {
      conversation_id: conversationId,
    });
    return response.data;
  },

  // Migrate anonymous session
  migrateSession: async (sessionId, anonymousUserId = null) => {
    const response = await api.post(chatbotConfig.endpoints.migrate, {
      session_id: sessionId,
      anonymous_user_id: anonymousUserId,
    });
    return response.data;
  },
};

export default api;

