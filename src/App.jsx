import React from 'react';
import Chatbot from './components/Chatbot';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Reusable Chatbot & Complaint System</h1>
        <p className="text-gray-400 mb-8">
          This is a standalone, reusable React chatbot and complaint system.
          The chatbot appears as a floating button in the bottom-right corner.
        </p>
        
        <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>✅ Real-time chat with Socket.IO</li>
            <li>✅ FAQ system with intelligent matching</li>
            <li>✅ Image upload support (multiple images)</li>
            <li>✅ Complaint submission system</li>
            <li>✅ Anonymous and logged-in user support</li>
            <li>✅ Unread message count</li>
            <li>✅ Draggable floating button</li>
            <li>✅ Mobile responsive</li>
          </ul>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <p className="text-gray-300 mb-2">
            Edit <code className="bg-gray-700 px-2 py-1 rounded">src/config/chatbotConfig.js</code> to configure:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300 mt-4">
            <li>API Base URL</li>
            <li>Socket.IO URL</li>
            <li>Feature flags</li>
            <li>Image upload settings</li>
          </ul>
        </div>
      </div>

      {/* Chatbot Component - Renders as floating button */}
      <Chatbot />
    </div>
  );
}

export default App;

