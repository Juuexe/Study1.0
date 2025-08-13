import { useState } from 'react';
import './App.css';

function CreateRoomForm({ token, onRoomCreated }) {
  const [roomName, setRoomName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('https://study1-0.onrender.com/api/rooms/create', {
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
      <div className="form-group">
        <label className="form-label">Room Name</label>
        <input
          type="text"
          className="form-input"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="e.g., Math Study Group, CS 101 Review"
          required
        />
      </div>
      <button className="btn btn-success" type="submit" style={{ width: '100%' }}>
        Create Room
      </button>
    </form>
  );
}

export default CreateRoomForm;
