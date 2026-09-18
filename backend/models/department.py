from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from . import Base

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # ID менеджера подразделения

    # Связь с менеджером подразделения
    manager = relationship("User", foreign_keys=[manager_id])
    # Связь с пользователями через промежуточную таблицу
    users = relationship("User", secondary="elibrary.user_departments", back_populates="departments", overlaps="user_department_assoc")
