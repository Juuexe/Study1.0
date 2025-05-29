import { useEffect, useState } from 'react';

function RoomList({ refreshKey, onLogout, onEnterRoom }) {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [joinMessage, setJoinMessage] = useState('');

  useEffect(() => {
    const fetchRooms = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('https://study1-0.onrender.com/api/rooms', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to fetch rooms');
        }

        setRooms(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchRooms();
  }, [refreshKey]);

  const handleJoin = async (roomId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`https://study1-0.onrender.com/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to join room');
      }

      setJoinMessage(` ${data.message}`);
    
    } catch (err) {
      console.error(err);
      setJoinMessage(` ${err.message}`);
    }
  };

  return (
    <div>
       <button onClick={onLogout} style={{ float: 'right' }}>Logout</button>
      <h2>Available Study Rooms</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {joinMessage && <p style={{ color: 'blue' }}>{joinMessage}</p>}
      <ul>
        {rooms.map((room) => (
          <li key={room._id}>
            <h3>{room.name}</h3>
            <p>{room.description}</p>
            <small>Room ID: {room._id}</small><br />
            <button onClick={() => handleJoin(room._id)}>Join Room</button>
            <button onClick={() => onEnterRoom(room._id)}>Enter Room</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default RoomList;

