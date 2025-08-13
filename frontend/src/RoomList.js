import { useEffect, useState } from 'react';

function RoomList({ refreshKey, onLogout, onEnterRoom, userId }) {
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


  const handleDelete = async (roomId) => {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`https://study1-0.onrender.com/api/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete room');

    setRooms(rooms.filter(room => room._id !== roomId)); // Remove from UI
  } catch (err) {
    console.error(err);
    setError(err.message);
  }
};

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
      <div className="flex justify-between items-center mb-4">
        <h2 className="section-title" style={{ margin: 0 }}>Available Study Rooms</h2>
        <button onClick={onLogout} className="btn btn-secondary btn-small">
          Logout
        </button>
      </div>
      
      {error && (
        <div className="alert alert-error">{error}</div>
      )}
      
      {joinMessage && (
        <div className="alert alert-info">{joinMessage}</div>
      )}
      
      {rooms.length === 0 ? (
        <div className="card text-center">
          <p className="card-subtitle">No study rooms available yet. Create the first one!</p>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => (
            <div key={room._id} className="card room-card">
              <div className="card-header">
                <h3 className="card-title">{room.name}</h3>
                {room.description && (
                  <p className="card-subtitle">{room.description}</p>
                )}
              </div>
              
              <div className="room-actions">
                <div className="flex" style={{ gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleJoin(room._id)}
                    className="btn btn-outline btn-small"
                  >
                    Join
                  </button>
                  <button 
                    onClick={() => onEnterRoom(room._id)}
                    className="btn btn-small" 
                    style={{ flex: 1 }}
                  >
                    Enter Room
                  </button>
                  {room.creator === userId && (
                    <button 
                      onClick={() => handleDelete(room._id)}
                      className="btn btn-danger btn-small"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RoomList;

