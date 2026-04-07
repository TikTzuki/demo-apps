from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    job_descriptions = relationship(
        "JobDescription", back_populates="department", cascade="all, delete-orphan"
    )
    cvs = relationship("CV", back_populates="department", cascade="all, delete-orphan")


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=False)
    department_id = Column(
        Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    department = relationship("Department", back_populates="job_descriptions")
    matches = relationship(
        "CVJDMatch", back_populates="job_description", cascade="all, delete-orphan"
    )


class CV(Base):
    __tablename__ = "cvs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    department_id = Column(
        Integer, ForeignKey("departments.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    file_path = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=True)
    status = Column(String(20), default="pending", nullable=False)  # pending, passed, failed

    department = relationship("Department", back_populates="cvs")
    review = relationship(
        "CVReview", back_populates="cv", uselist=False, cascade="all, delete-orphan"
    )
    matches = relationship(
        "CVJDMatch", back_populates="cv", cascade="all, delete-orphan"
    )


class CVReview(Base):
    __tablename__ = "cv_reviews"

    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(
        Integer,
        ForeignKey("cvs.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    review_text = Column(Text, nullable=False)
    strengths = Column(Text, nullable=False)  # JSON string of list
    weaknesses = Column(Text, nullable=False)  # JSON string of list
    overall_score = Column(Float, nullable=False)
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    cv = relationship("CV", back_populates="review")


class CVJDMatch(Base):
    __tablename__ = "cv_jd_matches"
    __table_args__ = (
        UniqueConstraint("cv_id", "jd_id", name="uq_cv_jd_match"),
    )

    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(
        Integer, ForeignKey("cvs.id", ondelete="CASCADE"), nullable=False
    )
    jd_id = Column(
        Integer,
        ForeignKey("job_descriptions.id", ondelete="CASCADE"),
        nullable=False,
    )
    match_percentage = Column(Float, nullable=False)
    match_details = Column(Text, nullable=False)
    matched_items = Column(Text, nullable=True)  # JSON string of list
    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    cv = relationship("CV", back_populates="matches")
    job_description = relationship("JobDescription", back_populates="matches")
