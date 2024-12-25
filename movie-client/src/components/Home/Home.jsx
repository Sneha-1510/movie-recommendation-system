import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Home.css';
import { NavLink, useNavigate } from 'react-router-dom';


function Home() {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [userDetails, setUserDetails] = useState({ username: '', email: '' });
  const [trending, setTrending] = useState([]);
  const [liked, setLiked] = useState([]);

  const navigate = useNavigate();

  const profilePopupRef = useRef(null);

  const handleProfileClick = () => {
    setShowProfilePopup((prev) => !prev);
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios
        .get('http://127.0.0.1:8000/user/user-profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setUserDetails(response.data);
        })
        .catch((error) => {
          navigate("/login");
          console.error('Error fetching user details:', error);
        });
    }else{
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        axios
        .get('http://127.0.0.1:8000/user/trending', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setTrending(response.data);
        })
        .catch((error) => {
          console.error('Error fetching user details:', error);
        });

        axios
        .get('http://127.0.0.1:8000/services/get-liked-recommendations', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => {
          setLiked(response.data);
          console.log(response.data);
        })
        .catch((error) => {
          console.error('Error fetching user details:', error);
        });
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profilePopupRef.current &&
        !profilePopupRef.current.contains(event.target)
      ) {
        setShowProfilePopup(false);
      }
    };

    if (showProfilePopup) {
      document.addEventListener('mousedown', handleOutsideClick);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
    }

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showProfilePopup]);

//   const movies = [
//     { id: 1, title: 'Avengers: Endgame' },
//     { id: 2, title: 'The Dark Knight' },
//     { id: 3, title: 'Inception' },
//     { id: 4, title: 'Interstellar' },
//     { id: 5, title: 'Parasite' },
//     { id: 6, title: 'Joker' },
//     { id: 7, title: 'Frozen II' },
//     { id: 8, title: 'Spider-Man: No Way Home' },
//     { id: 9, title: 'Black Panther' },
//     { id: 10, title: 'The Lion King' },
//   ];

  return (
    <div className="home-container">
        
      <nav className="navbar">
        <h1 className="navbar-logo">Netflix</h1>
        <div className="profile-container">
          <img
            src="https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg"
            alt="Profile"
            className="profile-icon"
            onClick={handleProfileClick}
          />
          {showProfilePopup && (
            <div className="profile-popup" ref={profilePopupRef}>
              <div className="user-details">
                <p>{userDetails.username}</p>
                <p>{userDetails.email}</p>
              </div>
              <button onClick={handleSignOut}>Sign Out</button>
            </div>
          )}
        </div>
      </nav>

      <div className="movie-section">
        <h2>Trending Now</h2>
        <div className="movie-cards">
          {trending.length > 0 ? 
            trending.map((movie) => (
                <div className="movie-card" key={movie.id}>
                <img
                    src={`${movie.image_url}`}
                    alt={movie.title}
                />
                <p className="movie-title" title={movie.title}>
                    {movie.title.length > 15
                    ? movie.title.slice(0, 15) + '...'
                    : movie.title}
                </p>
                </div>
            )) : (
                [...Array(10)].map((movie, idx) => (
                    <div className="movie-card" key={idx}>
                    <img
                        src={'https://via.placeholder.com/200x300?text=Loading...'}
                        alt={'Loading...'}
                    />
                    <p className="movie-title" title={"Loading.."}>
                        Loading...
                    </p>
                    </div>
                ))
            )
          }
        </div>
      </div>

      <div className="movie-section">
      <h2>You May Like</h2>
        <div className="movie-cards">
          {liked.length > 0 ? 
            liked.map((movie) => (
                <div className="movie-card" key={movie.id}>
                <img
                    src={`${movie.image_url}`}
                    alt={movie.title}
                />
                <p className="movie-title" title={movie.title}>
                    {movie.title.length > 15
                    ? movie.title.slice(0, 15) + '...'
                    : movie.title}
                </p>
                </div>
            )) : (
                [...Array(10)].map((movie, idx) => (
                    <div className="movie-card" key={idx}>
                    <img
                        src={'https://via.placeholder.com/200x300?text=Loading...'}
                        alt={'Loading...'}
                    />
                    <p className="movie-title" title={"Loading.."}>
                        Loading...
                    </p>
                    </div>
                ))
            )
          }
        </div>
        </div>
    </div>
  );
}

export default Home;
