from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings


def engine_url(database_url: str):
    """
    The database URL with the PostgreSQL driver named explicitly.

    A plain "postgresql://" URL means psycopg2 up to SQLAlchemy 2.0 and psycopg 3
    from 2.1, and only psycopg2 is installed: every fresh build stopped starting
    once 2.1 was released (issue #54). Naming the driver keeps the URLs already
    in deployments working whatever SQLAlchemy version is installed.
    """
    url = make_url(database_url)
    if url.drivername == "postgresql":
        url = url.set(drivername="postgresql+psycopg2")
    return url


engine = create_engine(engine_url(settings.database_url))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
