import { useState, useEffect } from 'react';
import AuthForm from './Authform';
import RoomList from './RoomList';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  return (
    <div>
      <h1>Study Group App</h1>
      {isLoggedIn ? <RoomList /> : <AuthForm />}
    </div>
  );
}

export default App;
