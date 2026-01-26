/**
 * FAQ Responses
 * All predefined responses for the chatbot
 */

export const FAQ_RESPONSES = {
  "login": "To login, click on the Login button on the top right. Enter your registered email and password, then click Submit. If credentials are correct, you will be redirected to your dashboard.",

  "sign up": "To create an account, click on the Sign Up button. Fill in your name, email, mobile number, and password. After submitting, verify your email using the OTP sent to you.",

  "signup": "To register, go to the Sign Up page, enter your details, and verify your email with OTP. Once verified, you can login and start using the platform.",

  "how to use chatbot": "You can type your questions in the chat box and press Enter. The chatbot will automatically reply based on your query like login help, signup steps, or complaint registration.",

  "use chatbot": "Simply write your question in simple English such as 'How to login' or 'How to register'. The chatbot will guide you step by step.",

  "complaint": "To raise a complaint, type your issue clearly in the chat, for example: 'My account is not working'. The chatbot will register your complaint and forward it to the support team.",

  "how to complain": "You can raise a complaint by typing 'I want to file a complaint' and then explaining your problem. The system will generate a complaint ticket for you.",

  "register complaint": "To register a complaint, describe your issue in the chat. Example: 'Payment not successful'. The chatbot will acknowledge and create a support request.",

  "help": "You can ask me about login, signup, using the chatbot, or registering complaints. Just type your question!",

  "contact support": "For support, either use this chatbot or go to the Contact Us page and submit the complaint form.",

  "forgot password": "Click on 'Forgot Password' on the login page, enter your registered email, and reset your password using the OTP sent to you.",

  "ok": "Great! Let me know if you need help with login, signup, or complaint registration 😊"
};

/**
 * Get time-based greeting
 */
export function getTimeBasedGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good morning! ☀️ ";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon! 🌤️ ";
  } else if (hour >= 17 && hour < 21) {
    return "Good evening! 🌆 ";
  } else {
    return "Hello! 👋 ";
  }
}

/**
 * Add greeting to response
 */
export function addGreetingToResponse(response, isLoggedIn = false) {
  const greetingPatterns = /^(Hello|Hi|Hey|Greetings|Welcome|Good morning|Good afternoon|Good evening)/i;
  if (greetingPatterns.test(response.trim())) {
    return response;
  }

  const greeting = getTimeBasedGreeting();
  return `${greeting}${response}`;
}

/**
 * Find best FAQ response
 */
export function findBestResponse(userMessage, isLoggedIn = false) {
  const lowerMessage = userMessage.toLowerCase();

  // Check for greetings
  if (lowerMessage.match(/\b(hi|hello|hey|greetings)\b/)) {
    return isLoggedIn
      ? "Hello! 👋 Welcome back!\n\nI'm here to help you with Technical support\n\nWhat would you like to know?"
      : "Hello! 👋 Welcome!\n\nI'm your AI assistant here to help you understand our platform and get started.\n\nWhat would you like to know?";
  }

  // Check for help requests
  if (lowerMessage.match(/\b(help|support|assist)\b/)) {
    return addGreetingToResponse(FAQ_RESPONSES.help, isLoggedIn);
  }

  // Check FAQ matches
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, response] of Object.entries(FAQ_RESPONSES)) {
    const keyWords = key.toLowerCase().split(/\s+/);
    let matchCount = 0;

    // Check for exact phrase match
    if (lowerMessage.includes(key.toLowerCase())) {
      matchCount = keyWords.length * 2; // Boost for exact match
    } else {
      // Count word matches
      for (const word of keyWords) {
        const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (wordRegex.test(lowerMessage)) {
          matchCount++;
        }
      }
    }

    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = { key, response };
    }
  }

  if (bestMatch && bestScore > 0) {
    return addGreetingToResponse(bestMatch.response, isLoggedIn);
  }

  // Default response
  const defaultResponse = `I understand you're asking about: "${userMessage}". Please wait for some time, our support team will get back to you soon. Is there anything else I can help you with?`;
  return addGreetingToResponse(defaultResponse, isLoggedIn);
}

