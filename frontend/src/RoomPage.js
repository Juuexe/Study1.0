import { useEffect, useState, useRef } from 'react';
import './App.css';

function RoomPage({ roomId, onBack }) {
  console.log(' RoomPage rendered with roomId:', roomId);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roomInfo, setRoomInfo] = useState(null);
  const [needsToJoin, setNeedsToJoin] = useState(false);
  const [joining, setJoining] = useState(false);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('token');
   console.log('🔑 Token exists:', !!token);
   console.log('🎯 Current state:', { 
    loading, 
    needsToJoin, 
    error, 
    messagesLength: messages.length,
    hasRoomInfo: !!roomInfo 
    });
  
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
      console.log('🔍 API Response:', { 
      status: res.status, 
      dataType: typeof data,
      isArray: Array.isArray(data),
      data: data 
    });

    console.log(' fetchMessages called for roomId:', roomId);
    setLoading(true);
    console.log('Fetching messages for room:', roomId);
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/rooms/${roomId}/messages?limit=50&page=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      console.log('Messages response:', { status: res.status, data });
      
      if (!res.ok) {
        // If user must join first, show join button
        if (data.message && data.message.includes('join the room first')) {
          console.log('User needs to join room');
          setNeedsToJoin(true);
          setError('');
          setMessages([]); // Clear any existing messages
        } else {
          console.error('Messages fetch error:', data.message);
          setError(data.message || 'Failed to load messages');
        }
        return;
      }
      
      console.log('User has access to room, setting needsToJoin to false');
      setNeedsToJoin(false);
      
      // Handle both old format (direct array) and new format (with pagination)
     if (Array.isArray(data)) {
      // Old format - direct message array
      console.log('📋 Setting messages (old format):', data.length, 'messages');
      setMessages(data);
    } else if (data && Array.isArray(data.messages)) {
      // New format - paginated response
      console.log('📋 Setting messages (new format):', data.messages.length, 'messages');
      setMessages(data.messages);
      setPagination(data.pagination);
    } else {
      // Unexpected format - log it and set empty array
      console.error('❌ Unexpected API response format:', data);
      setMessages([]); // Fallback to empty array
    }
      
      setError(''); // Clear any previous errors
    } catch (err) {
      console.error('Fetch messages error:', err);
      setError(err.message);
      setNeedsToJoin(false); // Don't show join button for network errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('RoomPage mounted or roomId changed:', roomId);
    if (roomId) {
      setLoading(true);
      fetchMessages();
      fetchRoomInfo();
    }
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

  const handleJoinRoom = async () => {
    setJoining(true);
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to join room');

      // After successful join, fetch messages and room info
      setNeedsToJoin(false);
      await fetchMessages();
      await fetchRoomInfo();
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  console.log('Render state:', { 
    loading, 
    needsToJoin, 
    hasError: !!error, 
    messagesCount: messages.length, 
    roomInfo: !!roomInfo 
  });

  // Ensure we never render a white screen
  if (loading && !needsToJoin && messages.length === 0 && !error) {
    console.log('Showing loading state');
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
          <div className="text-center" style={{ padding: '2rem' }}>
            <p className="card-subtitle">Loading room...</p>
          </div>
        </div>
      </div>
    );
  }

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
          {roomInfo && <p className="card-subtitle">Room: {roomInfo.name}</p>}
        </div>
        
        {error && (
          <div className="alert alert-error">{error}</div>
        )}
        
        {needsToJoin ? (
          <div className="text-center" style={{ padding: '2rem' }}>
            <div className="alert alert-info">
              <h3>Join this room to participate</h3>
              <p>You need to join this room before you can see messages and chat.</p>
              {roomInfo && (
                <div style={{ marginTop: '1rem' }}>
                  <p><strong>Room:</strong> {roomInfo.name}</p>
                  {roomInfo.description && <p><strong>Description:</strong> {roomInfo.description}</p>}
                  <p><strong>Participants:</strong> {roomInfo.participants.length}</p>
                </div>
              )}
              <button 
                onClick={handleJoinRoom}
                disabled={joining}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                {joining ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </div>
        ) : (
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
                 Array.isArray(messages) && messages.map((msg) => (
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
        )}
      </div>
    </div>
  );
}

export default RoomPage;
