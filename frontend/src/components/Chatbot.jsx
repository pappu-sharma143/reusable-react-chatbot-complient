import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { MessageCircle, X, Send, Bot, User, Upload, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { chatbotConfig } from '../config/chatbotConfig';
import { chatbotAPI } from '../services/api';
import { useChatbotSocket } from '../hooks/useChatbotSocket';
import { ComplaintForm } from './ComplaintForm';
import { findBestResponse } from '../data/faqResponses';
import secureStorage from '../utils/storage';
import { jwtDecode } from 'jwt-decode';

const QUICK_QUESTIONS = [
  "How do I sign up?",
  "What are trading plans?",
  "How to withdraw funds?",
  "Contact support",
];

export default function Chatbot({
  apiBaseUrl,
  socketUrl,
  onNavigate,
  getAuthToken,
  getUserInfo,
  ...props
}) {
  // Use custom config if provided, otherwise use default
  const config = {
    ...chatbotConfig,
    apiBaseUrl: apiBaseUrl || chatbotConfig.apiBaseUrl,
    socketUrl: socketUrl || chatbotConfig.socketUrl,
  };

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showAnonymousForm, setShowAnonymousForm] = useState(false);
  const [anonymousEmail, setAnonymousEmail] = useState('');
  const [anonymousName, setAnonymousName] = useState('');
  const [anonymousFormError, setAnonymousFormError] = useState('');
  const [anonymousUserId, setAnonymousUserId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [dragStartMouse, setDragStartMouse] = useState({ x: 0, y: 0 });

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const buttonRef = useRef(null);

  // Helper function to constrain position within viewport
  const constrainToViewport = useCallback((pos, isChatOpen = isOpen) => {
    if (typeof window === 'undefined') return pos;
    const buttonWidth = 56; // w-14 = 56px
    const buttonHeight = 56; // h-14 = 56px
    const chatWidth = 350; // w-[350px]
    const chatHeight = 600; // h-[600px]
    const width = isChatOpen ? chatWidth : buttonWidth;
    const height = isChatOpen ? chatHeight : buttonHeight;

    let newX = pos.x;
    let newY = pos.y;

    // Constrain horizontally
    if (newX < 0) newX = 0;
    if (newX > window.innerWidth - width) newX = Math.max(0, window.innerWidth - width);

    // Constrain vertically
    if (newY < 0) newY = 0;
    if (newY > window.innerHeight - height) newY = Math.max(0, window.innerHeight - height);

    return { x: newX, y: newY };
  }, [isOpen]);

  // Generate or retrieve session ID
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let session = secureStorage.getItem(config.storageKeys.sessionId);
      if (!session) {
        const browserFingerprint = navigator.userAgent + (navigator.language || '') + (screen.width || '') + (screen.height || '');
        const fingerprintHash = btoa(browserFingerprint).substring(0, 10);
        session = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${fingerprintHash}`;
        secureStorage.setItem(config.storageKeys.sessionId, session);
      }
      setSessionId(session);

      // Generate anonymous user ID if not logged in
      if (!secureStorage.getItem(config.storageKeys.authToken)) {
        const anonUserId = getOrCreateAnonymousUserId();
        setAnonymousUserId(anonUserId);
      }

      // Get user info
      checkUserInfo();

      // Set default position to bottom-right with viewport constraints
      const savedPosition = secureStorage.getItem(config.storageKeys.position);
      let initialPos;
      if (savedPosition) {
        try {
          initialPos = JSON.parse(savedPosition);
        } catch {
          // Default to bottom-right corner with 20px padding
          initialPos = {
            x: window.innerWidth - 70,  // 56px button width + 14px padding
            y: window.innerHeight - 70, // 56px button height + 14px padding
          };
        }
      } else {
        // Default to bottom-right corner with 20px padding
        initialPos = {
          x: window.innerWidth - 70,  // 56px button width + 14px padding
          y: window.innerHeight - 70, // 56px button height + 14px padding
        };
      }
      // Ensure saved position is within viewport (button is closed initially)
      setPosition(constrainToViewport(initialPos, false));
    }
  }, []);

  const getOrCreateAnonymousUserId = () => {
    if (typeof window === 'undefined') return -1;
    const stored = secureStorage.getItem(config.storageKeys.anonymousUserId);
    if (stored) {
      const userId = parseInt(stored, 10);
      if (!isNaN(userId)) return userId;
    }
    const randomUserId = -Math.floor(Math.random() * 99000000 + 1000000);
    secureStorage.setItem(config.storageKeys.anonymousUserId, randomUserId.toString());
    return randomUserId;
  };

  const checkUserInfo = () => {
    try {
      const token = getAuthToken ? getAuthToken() : secureStorage.getItem(config.storageKeys.authToken);
      if (token) {
        const decoded = jwtDecode(token);
        const userInfoFromToken = getUserInfo ? getUserInfo() : {
          userId: decoded.userId || decoded.id || decoded.user_id || null,
          email: decoded.email || null,
          name: decoded.name || null,
        };
        setUserInfo(userInfoFromToken);
      } else {
        setUserInfo(null);
        const storedEmail = secureStorage.getItem('chatbot_anonymous_email');
        const storedName = secureStorage.getItem('chatbot_anonymous_name');
        if (storedEmail && storedName) {
          setAnonymousEmail(storedEmail);
          setAnonymousName(storedName);
        }
        const anonUserId = getOrCreateAnonymousUserId();
        setAnonymousUserId(anonUserId);
      }
    } catch (error) {
      console.error('Error checking user info:', error);
      setUserInfo(null);
    }
  };

  // Socket connection
  const {
    isConnected: isSocketConnected,
    connectionError,
    emitNewMessage,
    onMessageReceived,
  } = useChatbotSocket({
    conversationId,
    userId: userInfo?.userId || anonymousUserId,
    sessionId,
    isAdmin: false,
    enabled: isOpen && !showAnonymousForm && !!sessionId,
  });

  // Listen for real-time messages
  useEffect(() => {
    if (!isOpen || showAnonymousForm) return;

    onMessageReceived((data) => {
      setMessages((prev) => {
        const messageExists = prev.some(
          (msg) => msg.text === data.message && msg.sender === data.sender
        );
        if (messageExists) return prev;

        let imageUrls = [];
        let text = data.message;
        const imageMatches = text.matchAll(/\[Image: ([^\]]+)\]/g);
        for (const match of imageMatches) {
          imageUrls.push(getAbsoluteImageUrl(match[1]));
        }
        if (imageUrls.length > 0) {
          text = text.replace(/\[Image: [^\]]+\]\n?/g, '').trim();
          if (!text) text = imageUrls.length > 1 ? `[${imageUrls.length} Images]` : '[Image]';
        }

        return [...prev, {
          id: Date.now().toString(),
          text,
          sender: data.sender,
          timestamp: new Date(data.timestamp),
          imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        }];
      });
    });
  }, [isOpen, showAnonymousForm, onMessageReceived]);

  const getAbsoluteImageUrl = (imageUrl) => {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      const baseUrl = typeof window !== 'undefined'
        ? window.location.origin
        : config.apiBaseUrl;
      return `${baseUrl}${imageUrl}`;
    }
    return imageUrl;
  };

  // Load chat history
  const loadChatHistory = async () => {
    if (!sessionId) return;
    setIsLoadingHistory(true);
    try {
      const response = await chatbotAPI.getMessages(sessionId, userInfo?.userId || anonymousUserId);
      if (response.success && response.data && response.data.length > 0) {
        const loadedMessages = response.data.map((msg) => {
          let imageUrls = [];
          let text = msg.message;
          const imageMatches = text.matchAll(/\[Image: ([^\]]+)\]/g);
          for (const match of imageMatches) {
            imageUrls.push(getAbsoluteImageUrl(match[1]));
          }
          if (imageUrls.length > 0) {
            text = text.replace(/\[Image: [^\]]+\]\n?/g, '').trim();
            if (!text) text = imageUrls.length > 1 ? `[${imageUrls.length} Images]` : '[Image]';
          }
          return {
            id: msg.id.toString(),
            text,
            sender: msg.sender,
            timestamp: new Date(msg.created_at),
            imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
          };
        });
        setMessages(loadedMessages);
        if (response.data[0]?.conversation_id) {
          setConversationId(response.data[0].conversation_id);
        }
      } else {
        const welcomeMessage = userInfo?.userId
          ? "Hello! I'm your Support Bot. How can I help you today?"
          : "Hello! I'm your Support Bot. How can I help you today?";
        setMessages([{
          id: '1',
          text: welcomeMessage,
          sender: 'bot',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Load history when opening
  useEffect(() => {
    if (isOpen && sessionId && !isLoadingHistory && !showAnonymousForm) {
      loadChatHistory();
    }
  }, [isOpen, sessionId, showAnonymousForm]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save message
  const saveMessage = async (message, sender) => {
    if (!sessionId) return;
    try {
      const body = {
        session_id: sessionId,
        message,
        sender,
      };
      if (!userInfo?.userId && anonymousUserId) {
        body.user_id = anonymousUserId;
        const storedEmail = secureStorage.getItem('chatbot_anonymous_email');
        const storedName = secureStorage.getItem('chatbot_anonymous_name');
        if (storedEmail && storedName) {
          body.anonymous_email = storedEmail;
          body.anonymous_name = storedName;
        }
      }
      const response = await chatbotAPI.saveMessage(body);
      if (response?.data?.conversation_id) {
        setConversationId(response.data.conversation_id);
        if (isSocketConnected && emitNewMessage) {
          emitNewMessage({
            conversation_id: response.data.conversation_id,
            message,
            user_id: userInfo?.userId || anonymousUserId,
            session_id: sessionId,
          });
        }
      }
      return response;
    } catch (error) {
      console.error('Error saving message:', error);
      return null;
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!input.trim() && selectedImages.length === 0) return;
    if (isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      text: userMessage || '[Image]',
      sender: 'user',
      timestamp: new Date(),
      imageUrls: imagePreviews.length > 0 ? [...imagePreviews] : undefined,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Upload images if any
    let imageUrls = [];
    if (selectedImages.length > 0) {
      try {
        const uploadResult = await chatbotAPI.uploadImage(selectedImages);
        if (uploadResult.success) {
          if (uploadResult.data?.imageUrls) {
            imageUrls = uploadResult.data.imageUrls;
          } else if (uploadResult.data?.imageUrl) {
            imageUrls = [uploadResult.data.imageUrl];
          }
        }
      } catch (error) {
        console.error('Error uploading images:', error);
      }
      setSelectedImages([]);
      setImagePreviews([]);
    }

    // Save user message
    await saveMessage(userMessage || (imageUrls.length > 0 ? `[Image: ${imageUrls[0]}]` : ''), 'user');

    // Get bot response
    try {
      const isLoggedIn = !!userInfo?.userId;
      let botResponse;

      // Try API first, fallback to local FAQ
      try {
        const apiResponse = await chatbotAPI.getBotResponse(userMessage || 'help');
        botResponse = apiResponse.response || findBestResponse(userMessage || 'help', isLoggedIn);
      } catch (apiError) {
        // Fallback to local FAQ matching
        botResponse = findBestResponse(userMessage || 'help', isLoggedIn);
      }

      const botMsg = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      await saveMessage(botResponse, 'bot');
    } catch (error) {
      console.error('Error getting bot response:', error);
      // Fallback response
      const fallbackMsg = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble processing your request. Please try again or contact support.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image select
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = [];
    for (const file of files) {
      if (!config.imageUpload.allowedTypes.includes(file.type.toLowerCase())) continue;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!ext || !config.imageUpload.allowedExtensions.includes(ext)) continue;
      if (file.size > config.imageUpload.maxSize) continue;
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    const previewPromises = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    try {
      const previews = await Promise.all(previewPromises);
      setSelectedImages(prev => [...prev, ...validFiles]);
      setImagePreviews(prev => [...prev, ...previews]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating previews:', error);
    }
  };

  // Handle quick question
  const handleQuickQuestion = (question) => {
    setInput(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return;
    setIsDragging(true);
    setDragStartMouse({ x: e.clientX, y: e.clientY });
    setDragStartPos({ x: position.x, y: position.y });
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartMouse.x;
    const deltaY = e.clientY - dragStartMouse.y;
    const newPos = {
      x: dragStartPos.x + deltaX,
      y: dragStartPos.y + deltaY,
    };
    setPosition(constrainToViewport(newPos));
  }, [isDragging, dragStartMouse, dragStartPos]);

  const handleMouseUp = () => {
    setIsDragging(false);
    if (typeof window !== 'undefined' && position.x > 0 && position.y > 0) {
      secureStorage.setItem(config.storageKeys.position, JSON.stringify(position));
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove]);

  // Keep within viewport on resize and when opening/closing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setPosition((currentPos) => constrainToViewport(currentPos));
    };

    // Constrain position when chatbot opens/closes (size changes)
    setPosition((currentPos) => constrainToViewport(currentPos));

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, constrainToViewport]);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div
          ref={buttonRef}
          className="fixed z-50 cursor-move"
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
          onMouseDown={handleMouseDown}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-lg animate-pulse" />
            <button
              onClick={() => setIsOpen(true)}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500/30 to-cyan-500/30 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
            >
              <MessageCircle className="h-7 w-7 text-emerald-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className="fixed z-50"
          style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
          <Card className="w-[350px] h-[600px] flex flex-col bg-gradient-to-br from-[#0B0F10] via-[#0F1A1A] to-[#111C18] border-emerald-500/40 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-emerald-500/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Support</h3>
                  <p className="text-xs text-gray-400">
                    {isSocketConnected ? 'Online' : connectionError ? 'Offline' : 'Connecting...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chatbotConfig.features.enableComplaint && (
                  <Button
                    size="sm"
                    onClick={() => setShowComplaintForm(true)}
                    className="h-8 px-3 bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md hover:shadow-lg"
                    title="Submit a complaint"
                  >
                    <AlertCircle className="h-4 w-4 mr-1.5" />
                    <span className="text-xs font-medium">Complient</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setIsOpen(false);
                    // Reset position to bottom-right corner
                    if (typeof window !== 'undefined') {
                      const defaultPos = {
                        x: window.innerWidth - 70,  // 56px button width + 14px padding
                        y: window.innerHeight - 70, // 56px button height + 14px padding
                      };
                      setPosition(defaultPos);
                      secureStorage.setItem(config.storageKeys.position, JSON.stringify(defaultPos));
                    }
                  }}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isLoadingHistory ? (
                <div className="text-center text-gray-400">Loading...</div>
              ) : (
                <>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        'flex gap-2',
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.sender !== 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-emerald-400" />
                        </div>
                      )}
                      <div
                        className={cn(
                          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                          message.sender === 'user'
                            ? 'bg-emerald-500 text-white'
                            : message.sender === 'admin'
                              ? 'bg-blue-500/20 text-blue-100 border border-blue-500/30'
                              : 'bg-gray-800/50 text-gray-100 border border-emerald-500/20'
                        )}
                      >
                        {message.imageUrls && message.imageUrls.length > 0 && (
                          <div className="mb-2 space-y-2">
                            {message.imageUrls.map((url, idx) => (
                              <img
                                key={idx}
                                src={url}
                                alt={`Uploaded ${idx + 1}`}
                                className="max-w-full h-auto max-h-48 object-contain rounded-lg"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-image.png';
                                }}
                              />
                            ))}
                          </div>
                        )}
                        {message.text && message.text !== '[Image]' && !message.text.match(/^\[\d+ Images?\]$/) && (
                          <p className="whitespace-pre-wrap">{message.text}</p>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {message.sender === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-emerald-400" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-2 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="bg-gray-800/50 text-gray-100 border border-emerald-500/20 rounded-lg px-4 py-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {QUICK_QUESTIONS.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs h-7"
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 border-t border-emerald-500/20 space-y-2">
              {imagePreviews.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-emerald-500/30"
                      />
                      <button
                        onClick={() => {
                          setSelectedImages(prev => prev.filter((_, i) => i !== index));
                          setImagePreviews(prev => prev.filter((_, i) => i !== index));
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10"
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || (!input.trim() && selectedImages.length === 0)}
                  className="h-10 w-10 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Complaint Form */}
      {showComplaintForm && (
        <ComplaintForm
          onClose={() => setShowComplaintForm(false)}
          onSuccess={(data) => {
            const successMsg = {
              id: Date.now().toString(),
              text: `Complaint submitted successfully! Ticket ID: ${data.ticket_id}. ${data.message}`,
              sender: 'bot',
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, successMsg]);
            setShowComplaintForm(false);
            setTimeout(() => loadChatHistory(), 500);
          }}
          userInfo={userInfo}
          conversationId={conversationId}
          sessionId={sessionId}
        />
      )}
    </>
  );
}

