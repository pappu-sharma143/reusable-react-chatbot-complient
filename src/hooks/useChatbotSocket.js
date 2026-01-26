import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { chatbotConfig } from '../config/chatbotConfig';
import secureStorage from '../utils/storage';

/**
 * Custom hook for chatbot socket connection
 */
export function useChatbotSocket({
  conversationId,
  userId,
  sessionId,
  isAdmin = false,
  enabled = true,
}) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Callbacks for events
  const onMessageReceivedRef = useRef(null);
  const onNewUserMessageRef = useRef(null);
  const onConversationUpdatedRef = useRef(null);

  // Initialize socket connection
  useEffect(() => {
    if (!enabled || !chatbotConfig.features.enableSocket) {
      console.log('Socket disabled or not enabled:', { enabled, enableSocket: chatbotConfig.features.enableSocket });
      return;
    }

    const token = secureStorage.getItem(chatbotConfig.storageKeys.authToken);
    let socketUrl = chatbotConfig.socketUrl;

    // Normalize socket URL - ensure it doesn't have trailing slashes
    socketUrl = socketUrl.replace(/\/+$/, '');

    // If URL doesn't start with http/https/ws/wss, assume it needs https://
    // Commented out for local development - uncomment for production if needed
    // if (!socketUrl.match(/^(https?|wss?):\/\//)) {
    //   socketUrl = `https://${socketUrl}`;
    // }

    console.log('Initializing socket connection:', {
      originalUrl: chatbotConfig.socketUrl,
      normalizedUrl: socketUrl,
      hasToken: !!token,
      conversationId,
      userId,
      sessionId,
      enabled,
    });

    // Create socket with improved error handling
    // Note: Socket.IO automatically appends /socket.io/ to the URL
    // If your server uses a custom path, uncomment and set the path option below
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'], // Try polling first (more compatible), then websocket
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      auth: token ? { token } : undefined,
      autoConnect: true,
      forceNew: false,
      withCredentials: false,
      // path: '/socket.io/', // Uncomment if your server uses a custom Socket.IO path
      path: '/socket.io/', // Default Socket.IO path
    });

    socketRef.current = socket;

    // Connection timeout handler
    const connectionTimeout = setTimeout(() => {
      if (!socket.connected) {
        console.warn('Socket connection timeout - continuing without real-time updates');
        setConnectionError('Connection timeout - using fallback mode');
        setIsConnected(false);
      }
    }, 10000);

    socket.on('connect', () => {
      clearTimeout(connectionTimeout);
      setIsConnected(true);
      setConnectionError(null);
      console.log('Socket connected successfully with ID:', socket.id);

      // Join appropriate rooms
      try {
        if (isAdmin) {
          socket.emit('admin_join');
        } else if (conversationId || userId || sessionId) {
          socket.emit('join_conversation', {
            conversation_id: conversationId,
            user_id: userId,
            session_id: sessionId,
          });
        }

        if (conversationId) {
          socket.emit('subscribe_conversation', conversationId);
        }
      } catch (error) {
        console.error('Error joining socket rooms:', error);
      }
    });

    socket.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('Socket disconnected:', {
        reason,
        socketId: socket.id,
      });
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        console.log('Server disconnected, attempting to reconnect...');
        socket.connect();
      }
    });

    socket.on('connect_error', (error) => {
      clearTimeout(connectionTimeout);
      const errorMessage = error.message || error.description || 'Failed to connect to server';
      console.error('Socket connection error:', {
        message: errorMessage,
        type: error.type,
        description: error.description,
        transport: error.transport,
        socketUrl,
        error: error,
      });
      setConnectionError(errorMessage);
      setIsConnected(false);
      // Don't block the app - allow it to work without socket
    });

    // Additional event listeners for debugging
    socket.io.on('error', (error) => {
      console.error('Socket.IO engine error:', error);
    });

    socket.io.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket.IO attempting to reconnect (attempt', attemptNumber, ')...');
    });

    socket.io.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed completely');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setConnectionError(null);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnection attempt', attemptNumber);
    });

    socket.on('reconnect_failed', () => {
      console.warn('Socket reconnection failed - continuing without real-time updates');
      setConnectionError('Reconnection failed - using fallback mode');
    });

    // Listen for messages
    socket.on('message_received', (data) => {
      if (onMessageReceivedRef.current) {
        onMessageReceivedRef.current(data);
      }
    });

    if (isAdmin) {
      socket.on('new_user_message', (data) => {
        if (onNewUserMessageRef.current) {
          onNewUserMessageRef.current(data);
        }
      });

      socket.on('conversation_updated', (data) => {
        if (onConversationUpdatedRef.current) {
          onConversationUpdatedRef.current(data);
        }
      });
    }

    return () => {
      if (socket.connected) {
        if (isAdmin) {
          socket.emit('admin_leave');
        } else {
          socket.emit('leave_conversation', {
            conversation_id: conversationId,
            user_id: userId,
            session_id: sessionId,
          });
        }

        if (conversationId) {
          socket.emit('unsubscribe_conversation', conversationId);
        }
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, isAdmin, conversationId, userId, sessionId]);

  // Update conversation subscription
  useEffect(() => {
    if (!socketRef.current || !isConnected || !conversationId) return;

    socketRef.current.emit('subscribe_conversation', conversationId);

    return () => {
      if (socketRef.current && isConnected) {
        socketRef.current.emit('unsubscribe_conversation', conversationId);
      }
    };
  }, [conversationId, isConnected]);

  // Emit new message
  const emitNewMessage = useCallback((data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('new_message', data);
    }
  }, [isConnected]);

  // Emit admin reply
  const emitAdminReply = useCallback((data) => {
    if (socketRef.current && isConnected && isAdmin) {
      socketRef.current.emit('admin_reply', data);
    }
  }, [isConnected, isAdmin]);

  // Emit bot message
  const emitBotMessage = useCallback((data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('bot_message', data);
    }
  }, [isConnected]);

  // Set event handlers
  const onMessageReceived = useCallback((callback) => {
    onMessageReceivedRef.current = callback;
  }, []);

  const onNewUserMessage = useCallback((callback) => {
    onNewUserMessageRef.current = callback;
  }, []);

  const onConversationUpdated = useCallback((callback) => {
    onConversationUpdatedRef.current = callback;
  }, []);

  return {
    isConnected,
    connectionError,
    emitNewMessage,
    emitAdminReply,
    emitBotMessage,
    onMessageReceived,
    onNewUserMessage,
    onConversationUpdated,
    socket: socketRef.current,
  };
}

