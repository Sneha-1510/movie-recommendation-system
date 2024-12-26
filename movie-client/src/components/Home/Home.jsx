import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Home.css';
import { NavLink, useNavigate } from 'react-router-dom';

function Home() {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [userDetails, setUserDetails] = useState({ username: '', email: '' });
  const [trending, setTrending] = useState([]);
  const [liked, setLiked] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('trending');
  const [posterUrls, setPosterUrls] = useState({}); // State for movie posters

  const navigate = useNavigate();
  const profilePopupRef = useRef(null);

  const genres = [
    { label: 'Trending', value: 'trending' },
    { label: 'Crime', value: 'crime' },
    { label: 'Adventure', value: 'adventure' },
    { label: 'Documentaries', value: 'documentaries' },
    { label: 'Family Movies', value: 'family' },
    { label: 'Romantic', value: 'romantic' },
    { label: 'Comedies', value: 'comedies' },
    { label: 'Horror', value: 'horror' },
    { label: 'Fantasy', value: 'fantasy' },
  ];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    axios
      .get('http://127.0.0.1:8000/user/user-profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setUserDetails(response.data))
      .catch(() => navigate('/login'));

    axios
      .get('http://127.0.0.1:8000/services/get-liked-recommendations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => setLiked(response.data))
      .catch(console.error);
  }, [navigate]);

  useEffect(() => {
    const fetchMovies = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      const url =
        selectedGenre === 'trending'
          ? 'http://127.0.0.1:8000/user/trending'
          : `http://127.0.0.1:8000/user/get-genre-${selectedGenre}`;

      try {
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrending(response.data);
      } catch (error) {
        console.error(`Error fetching ${selectedGenre} movies:`, error);
      }
    };

    fetchMovies();
  }, [selectedGenre]);

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

  const fetchMoviePoster = async (title) => {
    try {
      const encodedTitle = encodeURIComponent(title);
      const url = `http://www.omdbapi.com/?t=${encodedTitle}&apikey=197659c0`;
      const response = await axios.get(url);

      if (response.data && response.data.Poster) {
        return response.data.Poster;
      } else {
        return `https://via.placeholder.com/200x300?text=${title}`;
      }
    } catch (error) {
      console.error("Error fetching movie poster:", error.message);
      return `https://via.placeholder.com/200x300?text=${title}`;
    }
  };

  useEffect(() => {
    const loadPosters = async () => {
      const posters = {};
      for (const movie of trending) {
        posters[movie.title] = await fetchMoviePoster(movie.title);
      }
      setPosterUrls((prev) => ({ ...prev, ...posters }));
    };

    if (trending.length > 0) {
      loadPosters();
    }
  }, [trending]);

  const handleProfileClick = () => setShowProfilePopup((prev) => !prev);
  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };
  const handleMovieClick = (movie) => {
    navigate(`/movie/${encodeURIComponent(movie.title)}`, { state: { movie } });
  };
  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value);
  };

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
        <div className="movie-section-header">
          <h2>Trending Now</h2>
          <select
            className="genre-dropdown"
            value={selectedGenre}
            onChange={handleGenreChange}
          >
            {genres.map((genre) => (
              <option key={genre.value} value={genre.value}>
                {genre.label}
              </option>
            ))}
          </select>
        </div>

        <div className="movie-cards">
          {trending.length > 0
            ? trending.map((movie) => (
              <div
                className="movie-card"
                key={movie.id}
                onClick={() => handleMovieClick(movie)}
              >
                <img
                  src={posterUrls[movie.title] || 'https://via.placeholder.com/200x300?text=Loading...'}
                  alt={movie.title}
                />
                <p title={movie.title}>
                  {movie.title.length > 25
                    ? movie.title.slice(0, 25) + '...'
                    : movie.title}
                </p>
              </div>
            ))
            : [...Array(10)].map((_, idx) => (
              <div className="movie-card" key={idx}>
                <img
                  src={'https://via.placeholder.com/200x300?text=Loading...'}
                  alt={'Loading...'}
                />
                <p title={'Loading..'}>Loading...</p>
              </div>
            ))}
        </div>
      </div>

      <div className="movie-section">
        <h2>You May Like</h2>
        <div className="movie-cards">
          {liked.length > 0
            ? liked.map((movie) => (
              <div
                className="movie-card"
                key={movie.id}
                onClick={() => handleMovieClick(movie)}
              >
                <img src={`${movie.image_url}`} alt={movie.title} />
                <p title={movie.title}>
                  {movie.title.length > 25
                    ? movie.title.slice(0, 25) + '...'
                    : movie.title}
                </p>
              </div>
            ))
            : [...Array(10)].map((_, idx) => (
              <div className="movie-card" key={idx}>
                <img
                  src={'https://via.placeholder.com/200x300?text=Loading...'}
                  alt={'Loading...'}
                />
                <p title={'Loading..'}>Loading...</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
