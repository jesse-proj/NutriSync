from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_db_and_tables
from app.routes.auth_routes import router as auth_router
from app.routes.patient_routes import router as patient_router
from app.routes.clinician_routes import router as clinician_router
from app.routes.food_routes import router as food_router
from app.routes.chat_routes import router as chat_router

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
app.include_router(patient_router, prefix="/api")
app.include_router(clinician_router, prefix="/api")
app.include_router(food_router, prefix="/api")
app.include_router(chat_router, prefix="/api")

@app.get("/", tags=["Health Check"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "healthy", "service": "NutriSync RPM Backend"}
