"""Atlas Endüstri Ağı private interest-intake and approved public listings.

No records from this module are public until an administrator explicitly approves
an independent public project listing. Applicant contact data never leaves API.
"""
from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Boolean, Column, DateTime, String, Text, select, text
from sqlalchemy.orm import Session
from .database import Base, get_engine


class NetworkApplication(Base):
    __tablename__ = "atlas_network_applications"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    kind = Column(String(16), nullable=False)
    name = Column(String(180), nullable=False)
    contact_name = Column(String(140), nullable=False)
    email = Column(String(254), nullable=False)
    city = Column(String(120), nullable=False)
    specialty = Column(String(140), nullable=False)
    details = Column(Text, nullable=False)
    consent_confirmed = Column(Boolean, nullable=False)
    status = Column(String(24), nullable=False, default="pending")
    is_demo = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


class ApprovedProjectListing(Base):
    __tablename__ = "atlas_project_listings"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid4()))
    title = Column(String(200), nullable=False)
    city = Column(String(120), nullable=False)
    trade = Column(String(140), nullable=False)
    scope_summary = Column(Text, nullable=False)
    public_source_url = Column(Text, nullable=True)
    approval_status = Column(String(24), nullable=False, default="draft")
    public_visible = Column(Boolean, nullable=False, default=False)
    is_demo = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


def create_network_application(data: dict) -> str:
    engine = get_engine()
    if engine is None:
        raise RuntimeError("Database not configured")
    with Session(engine) as session:
        record = NetworkApplication(**data)
        session.add(record)
        session.commit()
        return record.id


def list_approved_projects(limit: int = 20) -> list[dict]:
    engine = get_engine()
    if engine is None:
        raise RuntimeError("Database not configured")
    with Session(engine) as session:
        records = session.scalars(
            select(ApprovedProjectListing)
            .where(ApprovedProjectListing.public_visible.is_(True))
            .where(ApprovedProjectListing.approval_status == "approved")
            .where(ApprovedProjectListing.is_demo.is_(False))
            .order_by(ApprovedProjectListing.created_at.desc())
            .limit(limit)
        ).all()
        return [{
            "id": p.id,
            "title": p.title,
            "city": p.city,
            "trade": p.trade,
            "scope_summary": p.scope_summary,
            "public_source_url": p.public_source_url or "",
        } for p in records]


def list_public_tenders(limit: int = 30) -> list[dict]:
    """Return *only* sanitized and source-checked tenders from the DB view.

    The view exposes no contact details and never includes demo, unverified,
    unpublished or private Base44 records. It is the sole public entrypoint.
    """
    engine = get_engine()
    if engine is None:
        raise RuntimeError("Database not configured")
    with Session(engine) as session:
        result = session.execute(text(
            "SELECT id,title,buyer_name,buyer_type,opportunity_type,notice_reference,"
            "city,country,industry,public_summary,source_platform,source_url,deadline,"
            "deadline_time,deadline_passed,required_capabilities,related_sectors,"
            "publication_checked_at,qualification_checked "
            "FROM atlas_app.published_tenders "
            "ORDER BY deadline_passed ASC,deadline ASC LIMIT :limit"
        ), {"limit": min(30, max(1, limit))}).mappings().all()
        return [dict(row) for row in result]
