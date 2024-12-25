import React from 'react';
import { BrowserRouter , Routes, Route } from 'react-router-dom'; 
import './App.css';
import Login from './components/Login/Login';
import SignUp from './components/SignUp/SignUp'; 
import Home from './components/Home/Home'; 

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
