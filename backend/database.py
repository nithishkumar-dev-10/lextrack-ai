from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency — inject this into every router that needs DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Database Models (Tables) ──────────────────────────────────

class Case(Base):
    __tablename__ = "cases"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(200), nullable=False)
    description = Column(Text)
    status      = Column(String(50), default="active")
    created_at  = Column(DateTime, default=datetime.utcnow)

class Hearing(Base):
    __tablename__ = "hearings"
    id           = Column(Integer, primary_key=True, index=True)
    case_id      = Column(Integer, nullable=False)
    title        = Column(String(200))
    hearing_date = Column(String(50))
    court        = Column(String(200))
    notes        = Column(Text)
    created_at   = Column(DateTime, default=datetime.utcnow)

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id         = Column(Integer, primary_key=True, index=True)
    query      = Column(Text)
    response   = Column(Text)
    agent_used = Column(String(100))
    confidence = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)