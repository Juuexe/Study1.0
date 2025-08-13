import { useEffect, useState, useRef } from 'react';
import './App.css';

function RoomPage({ roomId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchRoomInfo = async () => {
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load room info');
      setRoomInfo(data);
    } catch (err) {
      console.error('Failed to load room info:', err.message);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/rooms/${roomId}/messages?limit=50&page=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to load messages');
      
      // Handle both old format (direct array) and new format (with pagination)
      if (Array.isArray(data)) {
        // Old format - direct message array
        setMessages(data);
      } else {
        // New format - paginated response
        setMessages(data.messages || []);
        setPagination(data.pagination);
      }
      
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchRoomInfo();
  }, [roomId]);
  
  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/rooms/${roomId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete message');
      
      // Refresh messages
      await fetchMessages();
    } catch (err) {
      setError(err.message);
    }
  };
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
  
  const isUserMessage = (message) => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    return message.sender?._id === currentUser.id;
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/rooms/${roomId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send message');
      setNewMessage('');
      // Refresh messages to get the actual saved message
      await fetchMessages();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="section">
      <div className="flex justify-between items-center mb-4">
        <button onClick={onBack} className="btn btn-outline">
          ← Back to Room List
        </button>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Study Room Chat</h2>
          <p className="card-subtitle">Room ID: {roomId}</p>
        </div>
        
        {error && (
          <div className="alert alert-error">{error}</div>
        )}
        
        <div className="chat-container">
          <div className="messages-list">
            {loading && (
              <div className="text-center">
                <p className="card-subtitle">Loading messages...</p>
              </div>
            )}
            {messages.length === 0 && !loading ? (
              <div className="text-center">
                <p className="card-subtitle">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg._id || msg.timestamp} className="message">
                  <div className="message-header">
                    <span className="message-sender">
                      {msg.sender?.username || 'Unknown'}
                    </span>
                    <span className="message-time">
                      {formatTime(msg.timestamp)}
                      {msg.editedAt && <span className="edited-indicator"> (edited)</span>}
                    </span>
                    {isUserMessage(msg) && (
                      <button 
                        className="message-delete-btn"
                        onClick={() => handleDeleteMessage(msg._id)}
                        title="Delete message"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="chat-input">
            <input
              type="text"
              className="form-input"
              placeholder="Type your message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              style={{ margin: 0 }}
            />
            <button 
              onClick={handleSend} 
              className="btn btn-success"
              disabled={!newMessage.trim()}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomPage;
