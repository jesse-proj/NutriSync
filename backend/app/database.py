from typing import Generator
from sqlmodel import create_engine, SQLModel, Session
from app.config import settings

# For SQLite, check_same_thread=False is required by FastAPI
# since multiple threads can handle requests concurrently.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    settings.DATABASE_URL,
    echo=True,  # Set to False in production
    connect_args=connect_args,
)

def create_db_and_tables() -> None:
    """Initialize database tables defined in SQLModel."""
    SQLModel.metadata.create_all(engine)

def get_session() -> Generator[Session, None, None]:
    """Dependency to yield a database session."""
    with Session(engine) as session:
        yield session
