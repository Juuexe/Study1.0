import { useState, useEffect } from 'react';
import AuthForm from './Authform';
import RoomList from './RoomList';
import CreateRoomForm from './CreateRoomForm';
import RoomPage from './RoomPage';
import { jwtDecode } from 'jwt-decode';
//import './App.css';


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
          setUserId(decoded.userId);
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
    <div className = "container">
      <h1>Study Group App</h1>

      {isLoggedIn ? (
        currentRoomId ? (
          <RoomPage
            roomId={currentRoomId}
            onBack={() => setCurrentRoomId(null)} 
          />
        ) : (
          <>
            <CreateRoomForm
              token={localStorage.getItem('token')}
              onRoomCreated={() => setRoomsUpdated((prev) => !prev)}
            />
            <RoomList
             refreshKey={roomsUpdated}
             onLogout={handleLogout}
             onEnterRoom={(roomId) => setCurrentRoomId(roomId)} 
             userId={userId}
            />
          </>
        )
      ) : (
        <AuthForm onLogin={() => {
          setIsLoggedIn(true);
          setRoomsUpdated((prev) => !prev);
        }} />
      )}
    </div>
  );
}

export default App;

