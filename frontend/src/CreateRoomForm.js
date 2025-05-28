import { useState } from 'react';

function CreateRoomForm({ token, onRoomCreated }) {
  const [roomName, setRoomName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('https://study1-0.onrender.com/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: roomName })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Room created!');
        setRoomName('');
        onRoomCreated && onRoomCreated(data); // Optional callback
      } else {
        alert(data.message || 'Error creating room');
      }
    } catch (err) {
      console.error('Room creation failed:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create a New Room</h3>
      <input
        type="text"
        placeholder="Room name"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        required
      />
      <button type="submit">Create Room</button>
    </form>
  );
}

export default CreateRoomForm;
