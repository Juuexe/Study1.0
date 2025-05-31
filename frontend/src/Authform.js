import { useState } from 'react'; //; lets you add state variables to functional components
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
    const url = isLogin
      ? 'https://study1-0.onrender.com/api/auth/login'    
      : 'https://study1-0.onrender.com/api/auth/register';

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
    <div>
      <h2 className="section-title">Welcome</h2>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>         
      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
          />
        )}
        <br />            
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}  
        />
        <br />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
        />
        <br />
        <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
      </form>

      <p style={{ color: 'green' }}>{message}</p>     

      <button   onClick={() => setIsLogin(!isLogin)}>       
        Switch to {isLogin ? 'Register' : 'Login'}
      </button>
    </div>
  );
}

export default Authform;
