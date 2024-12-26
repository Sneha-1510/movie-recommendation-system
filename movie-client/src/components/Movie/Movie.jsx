import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './Movie.css';

function Movie() {
    const { state } = useLocation();
    const movie = state.movie;
    const imageUrl = state.imageUrl;

    const [isWatched, setIsWatched] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    console.log(movie);
    const handleWatch = () => {
        const token = localStorage.getItem('token');
        axios
            .post(
                'http://127.0.0.1:8000/user/add-watched',
                { show_id: movie.show_id },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then(() => {
                setIsWatched(true);
                alert(`${movie.title} has been added to your watched list!`);
            })
            .catch((error) => {
                console.error('Error adding movie to watched list:', error);
                alert('Something went wrong. Please try again later.');
            });
    };

    const handleLike = () => {
        const token = localStorage.getItem('token');

        axios
            .post(
                'http://127.0.0.1:8000/user/add-liked',
                { show_id: movie.show_id },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            .then(() => {
                setIsLiked(true);
                alert(`${movie.title} has been added to your liked list!`);
            })
            .catch((error) => {
                console.error('Error adding movie to liked list:', error);
                alert('Something went wrong. Please try again later.');
            });
    };

    return (
        <div className="movie-container">
            <div className="movie-image">
                <img src={imageUrl} alt={movie.title} />
            </div>
            <div className="movie-details">
                <h1 className="movie-title">{movie.title}</h1>
                <p className="movie-description">{movie.description}</p>
                <div className="movie-info">
                    <p>Director: {movie.director}</p>
                    <p>Release Year: {movie.release_year}</p>
                    <p>Rating: {movie.rating}</p>
                </div>

                <div className="button-container">
                    <button
                        className="movie-button"
                        onClick={handleWatch}
                        disabled={isWatched}
                    >
                        {isWatched ? "Watched" : "Watch"}
                    </button>
                    <button
                        className="movie-button"
                        onClick={handleLike}
                        disabled={isLiked}
                    >
                        {isLiked ? "Liked" : "Like"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Movie;
