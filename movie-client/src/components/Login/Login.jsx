import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';
import { NavLink, useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
  
    try {
      const response = await axios.post('http://127.0.0.1:8000/user/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      localStorage.setItem('token', response.data.access_token);
      navigate('/home');
    } catch (error) {
      setErrorMessage('Invalid username or password');
      console.error(error);
    }
  };
  

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Log In</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
          />
          {errorMessage && <p className="login-error">{errorMessage}</p>}
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>
        <p className="login-footer">
          New to Netflix? <NavLink to="/signup" style={{color: "red"}}>Sign Up now</NavLink>.
        </p>
      </div>
    </div>
  );
};

export default Login;
