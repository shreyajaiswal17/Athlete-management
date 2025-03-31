import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Welcome to PeakPulse! How can I assist you today?' } // Initial greeting
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:3000/api/chatbot', { message: input });
      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error. Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="chat-container">
      <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-6">
        <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-lg flex flex-col p-4">
          <h1 className="text-2xl font-bold text-center mb-4">Athlete Chatbot</h1>
          <div className="flex-1 overflow-y-auto bg-gray-700 p-4 rounded-lg mb-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 p-2 rounded-lg ${
                  msg.role === 'user' ? 'bg-blue-600 text-white self-end' : 'bg-gray-600 text-gray-200 self-start'
                }`}
              >
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ))}
            {isLoading && <div className="text-gray-400">AI is typing...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 bg-gray-700 text-white p-2 rounded-l-lg border border-gray-600 focus:outline-none"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className="bg-green-600 text-white px-4 py-2 rounded-r-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;