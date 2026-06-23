from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_db_and_tables
from app.routes.auth_routes import router as auth_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the database and create tables on startup
    create_db_and_tables()
    yield

app = FastAPI(
    title="NutriSync RPM API",
    description="Backend services for remote patient nutritional monitoring with DPA 2012 compliance.",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router, prefix="/api")

@app.get("/", tags=["Health Check"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "healthy", "service": "NutriSync RPM Backend"}
