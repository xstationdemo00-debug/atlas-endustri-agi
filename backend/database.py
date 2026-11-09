"""Neon PostgreSQL persistence. Never place DATABASE_URL in browser bundles.

Local SQLite is permitted only when ATLAS_DEV_SQLITE=1. Production deliberately
returns 503 without a working DB rather than claiming an inquiry was saved.
"""
import os
from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Boolean, Column, DateTime, String, Text, create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

class ServiceInquiry(Base):
    __tablename__ = "service_inquiries"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    company_name = Column(String(180), nullable=False)
    contact_name = Column(String(140), nullable=False)
    contact_email = Column(String(254), nullable=False)
    city = Column(String(120), nullable=True)
    service_type = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    consent_confirmed = Column(Boolean, nullable=False)
    status = Column(String(32), nullable=False, default="new")
    is_demo = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


def database_url():
    uri = os.environ.get("DATABASE_URL", "").strip()
    if uri:
        if uri.startswith("postgres://"):
            uri = "postgresql+psycopg://"+uri[len("postgres://"):]
        elif uri.startswith("postgresql://"):
            uri = "postgresql+psycopg://"+uri[len("postgresql://"):]
        return uri
    if os.environ.get("ATLAS_DEV_SQLITE") == "1":
        return "sqlite:///"+os.environ.get("ATLAS_DEV_SQLITE_PATH", "/tmp/atlas_endustri_local.sqlite3")
    return None

_engine = None

def get_engine():
    global _engine
    if _engine is not None:
        return _engine
    url = database_url()
    if not url:
        return None
    _engine = create_engine(url, pool_pre_ping=True, pool_recycle=300)
    if url.startswith("sqlite:"):
        from . import network  # registers network models before dev SQLite create_all
        Base.metadata.create_all(_engine)
    return _engine


def save_inquiry(data: dict) -> str:
    engine = get_engine()
    if engine is None:
        raise RuntimeError("Database not configured")
    with sessionmaker(bind=engine)() as session:
        item = ServiceInquiry(**data)
        session.add(item)
        session.commit()
        return item.id


def healthcheck_db():
    engine = get_engine()
    if engine is None:
        return False
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
        if engine.dialect.name == "postgresql":
            # Only mark the pilot ready when both intake tables and the public
            # approved-project view are reachable with the current app role.
            readonly = conn.execute(text("SHOW transaction_read_only")).scalar_one()
            if str(readonly).lower() in {"on", "true", "1"}:
                return False
            conn.execute(text("SELECT id FROM public.service_inquiries LIMIT 0"))
            conn.execute(text("SELECT id FROM public.atlas_network_applications LIMIT 0"))
            conn.execute(text("SELECT id FROM public.atlas_project_listings LIMIT 0"))
    return True
