import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './Home.css';
import { NavLink, useNavigate } from 'react-router-dom';

function Home() {
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [userDetails, setUserDetails] = useState({ username: '', email: '' });
  const [trending, setTrending] = useState([]);
  const [liked, setLiked] = useState([]);
  const [likedPosterUrls, setLikedPosterUrls] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('crime');
  const [posterUrls, setPosterUrls] = useState({});
  const [isFetchingPosters, setIsFetchingPosters] = useState(false);
  const [likedMovies, setLikedMovies] = useState([]);
  const [likeImg, setLikeImg] = useState('./outline_heart.png');
  const [newLike, setNewLike] = useState(false);

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
      .get(
        'http://127.0.0.1:8000/user/get-liked',
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        const liked_movies = response.data;
        for (const movie of liked_movies) {
          setLikedMovies((prevState) => [...prevState, movie.show_id]);
        }
      })
      .catch((error) => {
        console.error('Error adding movie to liked list:', error);
        alert('Something went wrong. Please try again later.');
      });


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

      axios
        .get('http://127.0.0.1:8000/services/get-liked-recommendations', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((response) => setLiked(response.data))
        .catch(console.error);
    };

    fetchMovies();
  }, [selectedGenre, newLike]);

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
      setIsFetchingPosters(true);
      const posters = {};
      for (const movie of trending) {
        posters[movie.title] = await fetchMoviePoster(movie.title);
        setPosterUrls((prev) => ({ ...prev, ...posters }));
      }
      setIsFetchingPosters(false);
    };

    if (trending.length > 0) {
      loadPosters();
    }
  }, [trending]);

  useEffect(() => {
    const loadPosters = async () => {
      setIsFetchingPosters(true);
      const posters = {};
      for (const movie of liked) {
        posters[movie.title] = await fetchMoviePoster(movie.title);
        setLikedPosterUrls((prev) => ({ ...prev, ...posters }));
      }
      setIsFetchingPosters(false);
    };

    if (liked.length > 0) {
      loadPosters();
    }
  }, [liked]);

  const handleProfileClick = () => setShowProfilePopup((prev) => !prev);
  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleMovieClick = (movie) => {
    navigate(`/movie/${encodeURIComponent(movie.title)}`, {
      state: { movie, imageUrl: posterUrls[movie.title] || likedPosterUrls[movie.title] || '' },
    });
  };

  const handleGenreChange = (event) => {
    setSelectedGenre(event.target.value);
  };

  const handleLike = (movie) => {
    const token = localStorage.getItem('token');

    axios
      .post(
        'http://127.0.0.1:8000/user/add-liked',
        { show_id: movie.show_id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then(() => {
        setLikedMovies((prev) => [...prev, movie.show_id]);
        setNewLike(!newLike);
      })
      .catch((error) => {
        console.error('Error adding movie to liked list:', error);
        alert('Something went wrong. Please try again later.');
      });
  };

  const getImgSrc = (show_id) => {
    console.log(show_id);
    if (likedMovies.includes(show_id)) {
      return './fill_heart.png';
    } else {
      return './outline_heart.png';
    }
  }

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
              <div className="movie-card" key={movie.id}>
                <div className="like-button" onClick={() => handleLike(movie)}>
                  <img
                    src={getImgSrc(movie.show_id)}
                    alt="Like icon"
                    height="10px"
                  />
                </div>
                <img
                  src={
                    posterUrls[movie.title] ||
                    'https://via.placeholder.com/200x300?text=Loading...'
                  }
                  alt={movie.title}
                  onClick={() => handleMovieClick(movie)}
                  className="poster"
                />
                <p title={movie.title} style={{color:"white"}}>
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
        {liked.length === 0 ? <>
          <p>No movies found in your liked list.</p>
          <p>
            To add movies to your liked list, watch a movie, or click on the like button
            next to the movie title.
          </p>
        </> : <></>}
        <div className="movie-cards">
          {liked.length > 0
            ? liked.map((movie) => (
              <div
                className="movie-card"
                key={movie.id}
              >
                <div className="like-button" onClick={() => handleLike(movie)}>
                  <img
                    src={getImgSrc(movie.show_id)}
                    alt="Like icon"
                    height="10px"
                  />
                </div>
                <img
                  src={likedPosterUrls[movie.title] || 'https://via.placeholder.com/200x300?text=Loading...'}
                  alt={movie.title}
                  onClick={() => handleMovieClick(movie)}
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
    </div>
  );
}

export default Home;
