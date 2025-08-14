import { useEffect, useState } from 'react';

function RoomList({ refreshKey, onLogout, onEnterRoom, userId }) {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [clearingRooms, setClearingRooms] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      const token = localStorage.getItem('token');
      try {
        const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
        const res = await fetch(`${apiBase}/api/rooms`, {
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
    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
    const res = await fetch(`${apiBase}/api/rooms/${roomId}`, {
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
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/rooms/${roomId}/join`, {
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

  const handleClearAllRooms = async () => {
    if (!window.confirm('⚠️ Are you sure you want to delete ALL rooms? This action cannot be undone!')) {
      return;
    }

    setClearingRooms(true);
    const token = localStorage.getItem('token');
    try {
      const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
      const res = await fetch(`${apiBase}/api/rooms/clear-all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: 'DELETE_ALL_ROOMS' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to clear rooms');

      setRooms([]); // Clear all rooms from UI
      setJoinMessage(`✅ ${data.message}`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setClearingRooms(false);
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
        <>
          {rooms.length > 0 && (
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-muted">{rooms.length} room{rooms.length > 1 ? 's' : ''} available</span>
              <button 
                onClick={handleClearAllRooms}
                disabled={clearingRooms}
                className="btn btn-danger btn-small"
                style={{ fontSize: '0.8rem' }}
              >
                {clearingRooms ? '🗑️ Clearing...' : '🗑️ Clear All Rooms'}
              </button>
            </div>
          )}
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
                  {(room.creator._id === userId || room.creator === userId) && (
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
        </>
      )}
    </div>
  );
}

export default RoomList;

