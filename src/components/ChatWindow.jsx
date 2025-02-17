import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, UserPlus, Loader } from 'lucide-react';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [userId, setUserId] = useState('');
  const ws = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const connectToChat = () => {
    setConnecting(true);
    ws.current = new WebSocket('ws://localhost:8080');
    
    ws.current.onopen = () => {
      const id = `user-${Math.floor(Math.random() * 1000)}`;
      setUserId(id);
      ws.current.send(JSON.stringify({
        type: 'HELLO',
        publicKey: id
      }));
      setConnected(true);
      setConnecting(false);
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'CHAT') {
        setMessages(prev => [...prev, message]);
      }
    };

    ws.current.onclose = () => {
      setConnected(false);
      setConnecting(false);
    };
  };

  const sendMessage = () => {
    if (!inputMessage.trim() || !ws.current) return;

    const message = {
      type: 'CHAT',
      content: inputMessage,
      sender: userId,
      timestamp: Date.now()
    };

    ws.current.send(JSON.stringify(message));
    setMessages(prev => [...prev, message]);
    setInputMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderConnectionStatus = () => {
    if (connecting) {
      return (
        <span className="flex items-center gap-2 text-sm text-yellow-500">
          <Loader className="w-4 h-4 animate-spin" />
          Connecting...
        </span>
      );
    }
    if (connected) {
      return (
        <span className="flex items-center gap-2 text-sm text-green-500">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Connected as {userId}
        </span>
      );
    }
    return (
      <button
        onClick={connectToChat}
        className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        Connect
      </button>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h1 className="text-xl font-semibold">P2P Chat</h1>
            </div>
            {renderConnectionStatus()}
          </div>
        </div>
        
        <div className="h-[600px] overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex flex-col ${
                message.sender === userId ? 'items-end' : 'items-start'
              }`}
            >
              <div className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                message.sender === userId
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-900'  // Added text color for received messages
              }`}>
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </p>
              </div>
              <span className="text-xs text-gray-500 mt-1 px-2">
                {message.sender === userId ? 'You' : `User ${message.sender.slice(-4)}`}
                {' • '}
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="border-t p-4 bg-white">
          <div className="flex gap-2">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={connected ? "Type a message..." : "Connect to start chatting..."}
              className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-[42px] max-h-[120px] overflow-y-auto disabled:bg-gray-50 disabled:cursor-not-allowed"
              disabled={!connected}
            />
            <button
              onClick={sendMessage}
              disabled={!connected}
              className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;