import { useEffect, useState } from 'react';

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');

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
  }, []);

 return (
  <div>
    <h2>Available Study Rooms</h2>
    {error && <p style={{ color: 'red' }}>{error}</p>}
    <ul>
      {rooms.map((room) => (
        <li key={room._id}>
          <h3>{room.name}</h3>
          <p>{room.description}</p>
          <small>Room ID: {room._id}</small>
        </li>
      ))}
    </ul>
  </div>
);

}

export default RoomList;
