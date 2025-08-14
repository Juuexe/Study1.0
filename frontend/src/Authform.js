import { useState } from 'react';
import './App.css';

function Authform({ onLogin }) {                        //declare a functional component - AuthForm
  const [isLogin, setIsLogin] = useState(true); // creates a a state variable isLogin, with initial value true, and a function setIsLogin to update it
  const [form, setForm] = useState({ username: '', email: '', password: '' }); // creates a state variable form, initialized with empty strings for username, email, and password, updating it with setForm
  const [message, setMessage] = useState(''); // creates a state variable message, initialized as an empty string, and a function setMessage to update it

  const handleChange = (e) => { // Declares a function that handles input field changes. e is the event object passed when an input changes.
    setForm({ ...form, [e.target.name]: e.target.value }); //  Updates the form state by spreading the existing form object (...form) and updating only the specific field that changed. e.target.name is the input's name attribute, e.target.value i
  };

  const handleSubmit = async (e) => { // Declares an async function to handle form submission. async allows using await for API calls.
    e.preventDefault(); //  Prevents the default form submission behavior (page refresh).
    const apiBase = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
    const url = isLogin
      ? `${apiBase}/api/auth/login`    
      : `${apiBase}/api/auth/register`;

    const payload = isLogin //Creates the data to send to the server. Login only needs email/password, registration needs username too.
      ? { email: form.email, password: form.password }
      : { username: form.username, email: form.email, password: form.password };

    try { // Tries to send a POST request to the server with the form data. Starts a try-catch block to handle potential errors during the API call.
      const res = await fetch(url, { // Sends a POST request to the specified URL (login or register) with the payload.
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // Converts the payload object to a JSON string for the request body.
      });

      const data = await res.json(); //  Converts the server's response from JSON format to a JavaScript object.
      if (!res.ok) {
        setMessage(data.message || 'Something went wrong.');
        return;
      }

      //If successful, handles login by saving the authentication token to browser storage and showing success message
      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setMessage('Logged in! ');
        onLogin();
      } else {
        setMessage('Registered! Now switch to login.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Error connecting to server');
    }
  };

// Renders h2 heading that displays "Login" or "Register" based on current mode.
//  <br />  Inserts a line break element for spacing.  
// <p style={{ color: 'green' }}>{message}</p> Paragraph element with green text color that displays the message state variable.
//

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '0 auto' }}>
      <div className="card-header text-center">
        <h2 className="card-title">{isLogin ? 'Welcome Back' : 'Join StudyHub'}</h2>
        <p className="card-subtitle">
          {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              name="username"
              className="form-input"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className="form-input"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            name="password"
            className="form-input"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        
        <button type="submit" className="btn btn-large" style={{ width: '100%' }}>
          {isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      {message && (
        <div className={`alert ${message.includes('Error') || message.includes('wrong') ? 'alert-error' : 'alert-success'}`}>
          {message}
        </div>
      )}

      <div className="text-center mt-4">
        <p className="card-subtitle">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}
        </p>
        <button 
          type="button"
          className="btn btn-outline" 
          onClick={() => setIsLogin(!isLogin)}
          style={{ width: '100%' }}
        >
          {isLogin ? 'Create Account' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}

export default Authform;
