from sqlalchemy import Column, Integer, String, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

    # Relationships
    history = relationship("TaskHistory", back_populates="owner")


class TaskHistory(Base):
    __tablename__ = "task_history"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, index=True)
    timestamp = Column(Integer)
    user_prompt = Column(String)
    agent_responses = Column(JSON)
    
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="history")
