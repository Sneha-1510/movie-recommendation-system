from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter
from datetime import datetime, timedelta
from typing import Optional
import pandas as pd
import numpy as np
import random
import os
from ..models import Base, User, Show, MoviesWatched, MoviesLiked

router = APIRouter(prefix="/services", tags=["services"])

# Get the absolute path to the database file
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, '..', '..'))
db_path = os.path.join(backend_dir, 'database.db')
# Ensure the path uses forward slashes for SQLite
db_path = db_path.replace('\\', '/')
DATABASE_URL = f"sqlite:///{db_path}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autoflush=False, autocommit=False, bind=engine)

SECRET_KEY = "cH@r@n$n3h@"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code = status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get('sub')
        if username is None:
            raise credentials_exception
        user = db.query(User).filter(User.username==username).first()
        if user is None:
            raise credentials_exception
        return user
    except JWTError:
        raise credentials_exception

def get_recommendations(current_user: User, preference: str, db: Session):
    if preference == "liked":
        preference_movies = db.query(MoviesLiked).filter(MoviesLiked.user_id == current_user.user_id).all()
        if not preference_movies:
            raise HTTPException(status_code=404, detail="No liked movies found for this user.")
    elif preference == "watched":
        preference_movies = db.query(MoviesWatched).filter(MoviesWatched.user_id == current_user.user_id).all()
        if not preference_movies:
            raise HTTPException(status_code=404, detail="No watched movies found for this user.")
    else:
        raise HTTPException(status_code=400, detail="Invalid preference type.")

    all_movies = db.query(Show).all()

    all_movies_df = pd.DataFrame([{
        "show_id": movie.show_id,
        "title": movie.title,
        "description": movie.description,
        "director": movie.director,
        "rating": movie.rating,
        "release_year": movie.release_year,
        "duration": movie.duration,
        "listed_in": movie.listed_in,
        "country": movie.country
    } for movie in all_movies])

    if all_movies_df.empty:
        raise HTTPException(status_code=404, detail="No movies found in the database.")

    preference_movie_ids = [movie.show_id for movie in preference_movies]
    other_preference = db.query(MoviesWatched if preference == "liked" else MoviesLiked).filter(
        MoviesWatched.user_id == current_user.user_id if preference == "liked" else MoviesLiked.user_id == current_user.user_id).all()
    excluded_movie_ids = set(preference_movie_ids + [movie.show_id for movie in other_preference])

    preference_movies_df = all_movies_df[all_movies_df['show_id'].isin(preference_movie_ids)]

    genre_list = []
    for genres in preference_movies_df['listed_in']:
        if genres:
            genre_list.extend([genre.strip() for genre in genres.split(',')])

    genre_counter = Counter(genre_list)
    top_genres = genre_counter.most_common(5)

    def combine_features(row):
        return f"{row['country']} {row['listed_in']} {row['release_year']}"

    all_movies_df['combined_features'] = all_movies_df.apply(combine_features, axis=1)

    tfidf = TfidfVectorizer(stop_words="english")
    tfidf_matrix = tfidf.fit_transform(all_movies_df['combined_features'])

    similarity_matrix = cosine_similarity(tfidf_matrix)

    preference_movie_indices = [all_movies_df[all_movies_df['show_id'] == mid].index[0] for mid in preference_movie_ids]
    aggregated_scores = similarity_matrix[preference_movie_indices].sum(axis=0)

    all_movies_df['similarity_score'] = aggregated_scores

    recommendations = []
    movies_recommended = set()
    for genre, _ in top_genres:
        genre_movies = all_movies_df[
            (all_movies_df['listed_in'].str.contains(genre, case=False, na=False)) &
            (~all_movies_df['show_id'].isin(excluded_movie_ids)) &
            (~all_movies_df['show_id'].isin(movies_recommended))
        ].sort_values(by='similarity_score', ascending=False).head(5)

        recommendations.extend(genre_movies.to_dict(orient="records"))
        movies_recommended.update(genre_movies['show_id'])

    if len(recommendations) < 20:
        additional_movies = all_movies_df[
            ~all_movies_df['show_id'].isin(excluded_movie_ids.union(movies_recommended))
        ].sort_values(by='similarity_score', ascending=False).head(20 - len(recommendations))
        recommendations.extend(additional_movies.to_dict(orient="records"))

    return {"recommendations": recommendations}

@router.get('/get-liked-recommendations', status_code=200)
def liked_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        liked_rec = get_recommendations(current_user, "liked", db)["recommendations"]
        return liked_rec
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/get-watched-recommendations', status_code=200)
def watched_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return get_recommendations(current_user, "watched", db)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/get-timed-recommendations')
def get_time_and_year_trend_recommendations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        watched_movies = (
            db.query(MoviesWatched, Show)
            .join(Show, MoviesWatched.show_id == Show.show_id)
            .filter(MoviesWatched.user_id == current_user.user_id)
            .all()
        )

        if not watched_movies:
            raise HTTPException(status_code=404, detail="No watched movies found for this user.")

        all_movies = db.query(Show).all()
        all_movies_df = pd.DataFrame([{
            "show_id": movie.show_id,
            "title": movie.title,
            "description": movie.description,
            "director": movie.director,
            "rating": movie.rating,
            "release_year": movie.release_year,
            "duration": movie.duration,
            "listed_in": movie.listed_in,
            "country": movie.country
        } for movie in all_movies])

        if all_movies_df.empty:
            raise HTTPException(status_code=404, detail="No movies found in the database.")

        watched_years = [entry.Show.release_year for entry in watched_movies if entry.Show.release_year]
        if not watched_years:
            raise HTTPException(status_code=404, detail="No release years available for watched movies.")

        year_counter = Counter(watched_years)
        most_common_years = year_counter.most_common(3)
        year_range = (min(watched_years), max(watched_years))

        recommendations = all_movies_df[
            (all_movies_df['release_year'].between(year_range[0], year_range[1])) &
            (~all_movies_df['show_id'].isin([entry.Show.show_id for entry in watched_movies]))
        ].copy()

        def calculate_year_score(year):
            return sum([abs(year - y) <= 2 for y, _ in most_common_years])

        recommendations['year_score'] = recommendations['release_year'].apply(calculate_year_score)
        recommendations = recommendations.sort_values(by='year_score', ascending=False).head(10)

        return {"recommendations": recommendations.to_dict(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
