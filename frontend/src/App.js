import { useState, useEffect } from 'react';
import AuthForm from './Authform';
import RoomList from './RoomList';
import CreateRoomForm from './CreateRoomForm';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [roomsUpdated, setRoomsUpdated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token); // Set true if token exists
  }, []);

  return (
    <div>
      <h1>Study Group App</h1>

      {isLoggedIn ? (
        <>
          {/* Only show this if the user is logged in */}
          <CreateRoomForm
            token={localStorage.getItem('token')}
            onRoomCreated={() => setRoomsUpdated((prev) => !prev)}
          />
          <RoomList key={roomsUpdated} />
        </>
      ) : (
        <AuthForm onLogin={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;

