# Movie Recommendation System

A full-stack application for movie recommendations built with FastAPI (backend) and React (frontend).

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)
- Node.js and npm
- Netflix titles CSV file (netflix_titles.csv) in the backend/app/data directory

## Setup Instructions

### Backend Setup

1. **Create and Activate Virtual Environment**
   ```bash
   # Navigate to backend directory
   cd backend

   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   # On Windows:
   .\venv\Scripts\activate
   # On Unix or MacOS:
   source venv/bin/activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Database Setup**
   - First, run the database initialization script to create and populate the database:
     ```bash
     python app/database/db.py
     ```
   - This script will:
     - Create the SQLite database file (`database.db`)
     - Create all necessary tables (users, shows, movies_watched, movies_liked)
     - Populate the shows table with data from the Netflix titles CSV
   - Make sure you have write permissions in the backend directory
   - The database file will be created in the backend directory

4. **Environment Variables**
   - Create a `.env` file in the backend directory with the following variables:
     ```
     SECRET_KEY=your_secret_key_here
     ALGORITHM=HS256
     ACCESS_TOKEN_EXPIRE_MINUTES=30
     ```

5. **Start the Backend Server**
   ```bash
   # Make sure you're in the backend directory
   python run.py
   ```
   - The server will start at `http://localhost:8000`
   - API documentation will be available at:
     - Swagger UI: `http://localhost:8000/docs`
     - ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. **Install Dependencies**
   ```bash
   # Navigate to frontend directory
   cd movie-client

   # Install dependencies
   npm install
   ```

2. **Start the Frontend Development Server**
   ```bash
   npm start
   ```
   - The frontend will start at `http://localhost:3000`

## Usage Instructions

1. **Sign Up**
   - Open `http://localhost:3000` in your browser
   - Click on "Sign Up" to create a new account
   - Fill in your details (username, email, password)
   - Submit the form to create your account

2. **Login**
   - After signing up, you'll be redirected to the login page
   - Enter your username and password
   - Click "Login" to access the application

3. **Using the Application**
   - Browse movies and shows
   - Like or mark movies as watched
   - Get personalized recommendations based on your preferences
   - Search for movies by genre, rating, or year
   - View your liked and watched movies

## Project Structure

```
movie-recommendation-system/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── main.py
│   │   │   ├── user_routes.py
│   │   │   └── recommendation.py
│   │   ├── database/
│   │   │   └── db.py
│   │   ├── data/
│   │   │   └── netflix_titles.csv
│   │   ├── models.py
│   │   └── __init__.py
│   ├── database.db
│   ├── requirements.txt
│   ├── run.py
│   └── README.md
└── movie-client/
    ├── public/
    ├── src/
    ├── package.json
    └── README.md
```

## Troubleshooting

1. **Backend Issues**
   - Ensure you've run `db.py` first to create and populate the database
   - Check if the database file exists in the backend directory
   - Ensure the database file has proper write permissions
   - Check if the database path in the code matches your system
   - Verify that all Python dependencies are installed correctly
   - Ensure the Netflix titles CSV file is present in the app/data directory

2. **Frontend Issues**
   - Make sure Node.js and npm are installed correctly
   - Clear npm cache if needed: `npm cache clean --force`
   - Delete node_modules and package-lock.json, then run `npm install` again
   - Check if the backend server is running and accessible

3. **Authentication Issues**
   - Check if the SECRET_KEY in your .env file matches the one in the code
   - Verify that the token is being sent correctly in the Authorization header
   - Clear browser cache and cookies if having login issues
