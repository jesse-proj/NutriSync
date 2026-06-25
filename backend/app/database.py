from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

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


def _migrate_db() -> None:
    """Add columns that are missing from existing tables (SQLite has no ALTER via create_all)."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    for table_name in inspector.get_table_names():
        cols = {c["name"] for c in inspector.get_columns(table_name)}
        if table_name == "dietary_targets":
            if "protein_g" not in cols:
                with engine.begin() as conn:
                    conn.execute(
                        text("ALTER TABLE dietary_targets ADD COLUMN protein_g FLOAT")
                    )
            if "fat_g" not in cols:
                with engine.begin() as conn:
                    conn.execute(
                        text("ALTER TABLE dietary_targets ADD COLUMN fat_g FLOAT")
                    )


def create_db_and_tables() -> None:
    """Initialize database tables defined in SQLModel."""
    import app.models  # Import all models to register with SQLModel

    SQLModel.metadata.create_all(engine)
    _migrate_db()


def get_session() -> Generator[Session, None, None]:
    """Dependency to yield a database session."""
    with Session(engine) as session:
        yield session
