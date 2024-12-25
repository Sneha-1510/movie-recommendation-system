import React, { useState } from 'react';
import axios from 'axios';
import './SignUp.css';
import { NavLink } from 'react-router-dom';


const SignUp = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // const formData = new URLSearchParams();
    // formData.append('username', username);
    // formData.append('password', password);
    // formData.append('email', email);

    try {
      const response = await axios.post(`http://127.0.0.1:8000/user/add-user?username=${username}&password=${password}&email=${email}`);
  
      alert('SignUp successful!');
      console.log(response.data);
    } catch (error) {
      setErrorMessage('SignUp Failed! Try Again!');
      console.error(error);
    }
  };
  

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-title">Sign In</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="signup-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="signup-input"
          />
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="signup-input"
          />
          {errorMessage && <p className="signup-error">{errorMessage}</p>}
          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>
        <p className="signup-footer">
          Already have an account? <NavLink to="/login" style={{color: "red"}}>Log In now</NavLink>.
        </p>
      </div>
    </div>
  );
};

export default SignUp;
