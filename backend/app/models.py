from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

def get_iso():
    utc = datetime.utcnow()
    return utc.date()

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    email = Column(String, unique=True)
    date_joined = Column(Date, default=get_iso)

    # Add relationships
    watched_movies = relationship("MoviesWatched", back_populates="user")
    liked_movies = relationship("MoviesLiked", back_populates="user")

class Show(Base):
    __tablename__ = "shows"
    show_id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(String)
    director = Column(String)
    rating = Column(String)
    release_year = Column(Integer)
    duration = Column(String)
    listed_in = Column(String)
    country = Column(String)
    date_added = Column(String)

    # Add relationships
    watched_by = relationship("MoviesWatched", back_populates="show")
    liked_by = relationship("MoviesLiked", back_populates="show")

class MoviesWatched(Base):
    __tablename__ = "movies_watched"
    watched_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    show_id = Column(Integer, ForeignKey("shows.show_id"))
    watch_date = Column(DateTime, default=datetime.utcnow)

    # Add relationships
    user = relationship("User", back_populates="watched_movies")
    show = relationship("Show", back_populates="watched_by")

class MoviesLiked(Base):
    __tablename__ = "movies_liked"
    liked_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    show_id = Column(Integer, ForeignKey("shows.show_id"))
    liked_date = Column(DateTime, default=datetime.utcnow)

    # Add relationships
    user = relationship("User", back_populates="liked_movies")
    show = relationship("Show", back_populates="liked_by") 