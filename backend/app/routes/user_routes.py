from fastapi import FastAPI, HTTPException, Depends, status, APIRouter
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Date, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
import random

router = APIRouter(prefix="/user", tags=["user"])

DATABASE_URL = "sqlite:///../database/database.db"
Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "cH@r@n$n3h@"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_iso():
    utc = datetime.utcnow()
    return utc.date()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    email = Column(String, unique=True)
    date_joined = Column(Date, default=get_iso)

class Show(Base):
    __tablename__ = "shows"
    show_id = Column(Integer, primary_key=True)
    title = Column(String)
    listed_in = Column(String)
    release_year = Column(Integer)
    rating = Column(String)

class MoviesWatched(Base):
    __tablename__ = "movies_watched"
    watched_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    show_id = Column(Integer, ForeignKey("shows.show_id"))
    watch_date = Column(DateTime, default=get_iso)

class MoviesLiked(Base):
    __tablename__ = "movies_liked"
    liked_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    show_id = Column(Integer, ForeignKey("shows.show_id"))
    liked_date = Column(DateTime, default=get_iso)


class UserUpdate(BaseModel):
    email: str

class ShowIDRequest(BaseModel):
    show_id: int

Base.metadata.create_all(bind=engine)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta if expires_delta else datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        return db.query(User).filter(User.username == username).first()
    except JWTError:
        raise credentials_exception

@router.post("/add-user/")
def add_user(username: str, password: str, email: str):
    hashed_password = get_password_hash(password)
    user = User(username=username, password=hashed_password, email=email)
    db.add(user)
    db.commit()
    return {"message": "User created successfully"}

@router.put("/update-user-details/")
def update_user_details(user_update: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == current_user.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.email = user_update.email
    db.commit()
    
    updated_user = db.query(User).filter(User.username == current_user.username).first()

    return {"message": "User details updated successfully", "user": updated_user}

@router.post("/add-watched/")
def add_watched(show_data: ShowIDRequest, current_user: User = Depends(get_current_user)):
    watched = MoviesWatched(user_id=current_user.user_id, show_id=show_data.show_id)
    db.add(watched)
    db.commit()
    return {"message": "Added to watched list"}

@router.post("/add-liked/")
def add_liked(show_data: ShowIDRequest, current_user: User = Depends(get_current_user)):
    liked = MoviesLiked(user_id=current_user.user_id, show_id=show_data.show_id)
    db.add(liked)
    db.commit()
    return {"message": "Added to liked list"}

@router.get("/get-random-movies/")
def get_random_movies():
    movies = db.query(Show).all()
    if not movies:
        raise HTTPException(status_code=404, detail="No movies found")
    return random.sample(movies, min(5, len(movies)))

@router.get("/get-movies-by-genre/")
def get_movies_by_genre(genre: str):
    movies = db.query(Show).filter(Show.listed_in.contains(genre)).all()
    return movies

@router.get("/get-movies-by-rating/")
def get_movies_by_rating(rating: str):
    movies = db.query(Show).filter(Show.rating == rating).all()
    return movies

@router.get("/get-movies-by-year/")
def get_movies_by_year(year: int):
    movies = db.query(Show).filter(Show.release_year == year).all()
    return movies

@router.post("/login/")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/user-profile/")
def get_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        "email": current_user.email,
        "date_joined": current_user.date_joined,
    }

@router.post("/logout/")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
