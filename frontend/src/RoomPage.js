// src/RoomPage.js
import { useEffect, useState } from 'react';

function RoomPage({ roomId, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(`https://study1-0.onrender.com/api/rooms/${roomId}/messages`, {
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
      const res = await fetch(`https://study1-0.onrender.com/api/rooms/${roomId}/message`, {
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

  return (
    <div>
      <button onClick={onBack}>← Back to Room List</button>
      <h2>Room: {roomId}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {messages.map((msg, idx) => (
          <li key={idx}>
            <strong>{msg.sender?.username || 'Unknown'}:</strong> {msg.content}
          </li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Type message"
        value={newMessage}
        onChange={e => setNewMessage(e.target.value)}
      />
      <button onClick={handleSend}>Send</button>
    </div>
  );
}

export default RoomPage;
