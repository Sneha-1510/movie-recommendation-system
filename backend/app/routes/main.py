from fastapi import FastAPI

import user_routes
import recommendation

app = FastAPI()

app.include_router(user_routes.router)
app.include_router(recommendation.router)

@app.get("/")
async def root():
    return {"message": "Welcome to the API"}
