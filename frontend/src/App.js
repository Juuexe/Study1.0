import { useState, useEffect } from 'react';
import AuthForm from './Authform';
import RoomList from './RoomList';
import CreateRoomForm from './CreateRoomForm'; 

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roomsUpdated, setRoomsUpdated] = useState(false); // To refresh room list

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div>
      <h1>Study Group App</h1>

      {isLoggedIn ? (
        <>
          <CreateRoomForm
            token={localStorage.getItem('token')}
            onRoomCreated={() => setRoomsUpdated(prev => !prev)}
          />
          <RoomList key={roomsUpdated} />
        </>
      ) : (
        <AuthForm />
      )}
    </div>
  );
}

export default App;
