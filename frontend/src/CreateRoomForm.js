// src/CreateRoomForm.js
import { useState } from 'react';

function CreateRoomForm({ token, onRoomCreated }) {
  const [roomName, setRoomName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://study1-0.onrender.com/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: roomName }),
      });

      const data = await response.json();

      if (response.ok) {
        setRoomName('');
        onRoomCreated(); // Trigger a refresh
      } else {
        console.error(data.message);
        alert(data.message || 'Failed to create room');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        placeholder="Enter room name"
        required
      />
      <button type="submit">Create Room</button>
    </form>
  );
}

export default CreateRoomForm;
