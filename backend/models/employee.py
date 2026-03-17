from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from . import Base

class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    fio = Column(String, nullable=False)

    # Связи многие-ко-многим
    departments = relationship("Department", secondary="elibrary.employee_departments", overlaps="Department.employees")
    articles = relationship("Article", secondary="elibrary.employee_articles", overlaps="Article.employees")