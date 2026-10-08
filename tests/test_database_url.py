"""
A plain postgresql:// URL uses the installed driver (issue #54).

SQLAlchemy 2.1 made "postgresql://" mean psycopg 3, which is not installed, so a
fresh build stopped starting. engine_url names psycopg2 explicitly.
"""

from app.database import engine_url


def test_a_plain_postgresql_url_gets_psycopg2():
    url = engine_url("postgresql://user:pw@db:5432/affinities")

    assert url.drivername == "postgresql+psycopg2"
    assert url.host == "db" and url.database == "affinities"


def test_an_explicit_driver_is_kept():
    url = engine_url("postgresql+psycopg://user:pw@db:5432/affinities")

    assert url.drivername == "postgresql+psycopg"


def test_other_databases_are_untouched():
    assert engine_url("sqlite:///:memory:").drivername == "sqlite"


def test_the_engine_can_be_created_with_the_default_url():
    """What failed at import time with SQLAlchemy 2.1."""
    from sqlalchemy import create_engine

    from app.config import Settings

    create_engine(engine_url(Settings(_env_file=None).database_url))
