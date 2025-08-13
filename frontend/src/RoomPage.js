import { useEffect, useState } from 'react';
import './App.css';

function RoomPage({ roomId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${apiBase}/api/rooms/${roomId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load messages');
        setMessages(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchMessages();
  }, [roomId, token]);

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
      setMessages(prev => [...prev, { content: newMessage, sender: { username: 'You' } }]);
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
            {messages.length === 0 ? (
              <div className="text-center">
                <p className="card-subtitle">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="message">
                  <div className="message-sender">
                    {msg.sender?.username || 'Unknown'}
                  </div>
                  <div className="message-content">{msg.content}</div>
                </div>
              ))
            )}
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
