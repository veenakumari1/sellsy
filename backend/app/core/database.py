import os
import logging
import time
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("storsy.database")

# Adjust database URL for SQLAlchemy if needed
raw_url = (settings.DATABASE_URL or "").strip()
if not raw_url:
    raw_url = "sqlite:///./sellsy.db"

# Normalize postgres schemes so SQLAlchemy 2.0 uses psycopg2 explicitly
if raw_url.startswith("postgres://"):
    database_url = raw_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+"):
    database_url = raw_url.replace("postgresql://", "postgresql+psycopg2://", 1)
else:
    database_url = raw_url

connect_args = {}
if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        pool_pre_ping=True
    )
except Exception as e:
    logger.error(f"Failed to create engine with database_url '{database_url}': {e}. Falling back to local SQLite.")
    database_url = "sqlite:///./sellsy.db"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db(max_retries: int = 3, retry_delay: float = 1.0):
    """
    Initializes database tables with retry logic to withstand startup connection delays in containers.
    """
    from app import models  # noqa: F401
    
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            logger.info(f"Connecting to database and initializing schema (attempt {attempt}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            logger.info("Database schema initialized successfully.")

            # Safe column migrations for existing tables (Postgres & SQLite compatible)
            try:
                from sqlalchemy import inspect, text
                inspector = inspect(engine)
                table_names = inspector.get_table_names()
                if "customers" in table_names:
                    customer_cols = [c["name"] for c in inspector.get_columns("customers")]
                    if "whatsapp" not in customer_cols:
                        with engine.begin() as conn:
                            conn.execute(text("ALTER TABLE customers ADD COLUMN whatsapp VARCHAR(50)"))
                        logger.info("Migrated: added 'whatsapp' column to customers table.")
                if "products" in table_names:
                    product_cols = [c["name"] for c in inspector.get_columns("products")]
                    if "reorder_level" not in product_cols:
                        with engine.begin() as conn:
                            conn.execute(text("ALTER TABLE products ADD COLUMN reorder_level INTEGER NOT NULL DEFAULT 10"))
                        logger.info("Migrated: added 'reorder_level' column to products table.")
            except Exception as e:
                logger.warning(f"Column migration check notice: {e}")

            # Ensure default achievement definitions exist
            try:
                from app.services.gamification_service import GamificationService
                with SessionLocal() as db:
                    GamificationService.ensure_definitions(db)
                logger.info("Default gamification definitions verified.")
            except Exception as e:
                logger.warning(f"Gamification definition check notice: {e}")

            return
        except Exception as e:
            last_err = e
            logger.warning(f"Database initialization attempt {attempt} failed: {e}")
            if attempt < max_retries:
                time.sleep(retry_delay)

    logger.error(f"Could not initialize database after {max_retries} attempts: {last_err}")
