from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from . import Base

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    fio = Column(String, nullable=False)
    # departments = relationship("Department", secondary=employee_departments, back_populates="employees")  # <-- Удалите