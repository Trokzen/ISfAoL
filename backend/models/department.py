from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from . import Base

class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    # employees = relationship("Employee", secondary=employee_departments, back_populates="departments")  # <-- Удалите