import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

logger = logging.getLogger("mirai_clubs.db")

Base = declarative_base()

def get_engine():
    db_url = settings.DATABASE_URL
    try:
        if db_url.startswith("postgresql"):
            # Test if postgres is connectable
            engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 3})
            with engine.connect() as conn:
                logger.info("Connected successfully to PostgreSQL database.")
                return engine
        else:
            return create_engine(db_url)
    except Exception as e:
        if settings.USE_SQLITE_FALLBACK:
            logger.warning(
                f"PostgreSQL connection to {db_url} failed ({e}). "
                f"Falling back to SQLite database at {settings.SQLITE_URL} for development/testing."
            )
            return create_engine(
                settings.SQLITE_URL, 
                connect_args={"check_same_thread": False}
            )
        else:
            raise e

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
