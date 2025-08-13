import { useState, useEffect } from 'react';
import AuthForm from './Authform';
import RoomList from './RoomList';
import CreateRoomForm from './CreateRoomForm';
import RoomPage from './RoomPage';
import { jwtDecode } from 'jwt-decode';
import './App.css';


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roomsUpdated, setRoomsUpdated] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const decoded = jwtDecode(token);

        // Check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          localStorage.removeItem('token');
          setIsLoggedIn(false);
          setUserId(null);
        } else {
          setIsLoggedIn(true);
          setUserId(decoded.id); // JWT tokens use 'id' field
        }
      } catch (err) {
        console.error('Invalid token:', err);
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUserId(null);
      }
    }
  }, []);

 const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  
  return (
    <div className="container">
      {!isLoggedIn && (
        <header className="app-header">
          <h1 className="app-title">StudyHub</h1>
          <p className="app-subtitle">Collaborate, Learn, Succeed Together</p>
        </header>
      )}

      {isLoggedIn ? (
        currentRoomId ? (
          <RoomPage
            roomId={currentRoomId}
            onBack={() => setCurrentRoomId(null)} 
          />
        ) : (
          <div className="section">
            <h2 className="section-title">Your Study Rooms</h2>
            <p className="section-subtitle">Create a new room or join an existing one to start studying</p>
            
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Create New Room</h3>
                <p className="card-subtitle">Start a new study session</p>
              </div>
              <CreateRoomForm
                token={localStorage.getItem('token')}
                onRoomCreated={() => setRoomsUpdated((prev) => !prev)}
              />
            </div>
            
            <RoomList
              refreshKey={roomsUpdated}
              onLogout={handleLogout}
              onEnterRoom={(roomId) => setCurrentRoomId(roomId)} 
              userId={userId}
            />
          </div>
        )
      ) : (
        <div className="section">
          <AuthForm onLogin={() => {
            setIsLoggedIn(true);
            setRoomsUpdated((prev) => !prev);
          }} />
        </div>
      )}
    </div>
  );
}

export default App;

