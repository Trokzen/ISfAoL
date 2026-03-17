from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, Date, DateTime, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from . import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    login = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=True)
    role = Column(String(50), default="user")
    full_name = Column(String(255), nullable=False)
    id_elibrary_user = Column(String(255), nullable=True)  # ID пользователя в системе elibrary
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Связь с подразделениями через промежуточную таблицу
    departments = relationship("Department", secondary="elibrary.user_departments", back_populates="users", overlaps="user_department_assoc")

    # Связь с авторами (если пользователь является автором)
    authored_articles = relationship("Author", back_populates="user_employee")


class Department(Base):
    __tablename__ = "departments"  # Исправлено с "departements" на "departments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Связь с менеджером
    manager = relationship("User", foreign_keys=[manager_id])

    # Связь с пользователями через промежуточную таблицу
    users = relationship("User", secondary="elibrary.user_departments", back_populates="departments", overlaps="user_department_assoc")


class UserDepartment(Base):
    __tablename__ = "user_departments"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    department_id = Column(Integer, ForeignKey("departments.id"), primary_key=True)
    is_primary = Column(Boolean, default=False)  # основное подразделение
    position_title = Column(String(255), nullable=True)  # должность
    created_at = Column(DateTime, default=func.now())

    # Связи
    user = relationship("User", backref="user_department_assoc", overlaps="departments")
    department = relationship("Department", backref="user_department_assoc", overlaps="users")


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    external_id = Column(Integer, unique=True, nullable=True)  # ID из внешней системы elibrary
    title = Column(String, nullable=False)
    year_pub = Column(Integer, nullable=False)
    in_rinc = Column(Boolean, default=False)

    # Связь с авторами
    authors = relationship("Author", back_populates="article", cascade="all, delete-orphan")
    # Связь с сотрудниками через статьи
    employees = relationship("User", secondary="elibrary.employee_articles", overlaps="employee_articles")


class Author(Base):
    __tablename__ = "authors"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    author_name = Column(String, nullable=False)  # имя автора как оно указано в статье
    user_employee_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # ID сотрудника (если это внутренний автор)
    contribution = Column(Float)  # вклад автора в статью
    __table_args__ = (CheckConstraint('contribution >= 0.0 AND contribution <= 100.0', name='check_contribution_range'),)
    applied_for_award = Column(Boolean, nullable=False, default=False)
    award_applied_date = Column(Date, nullable=True)
    
    # Связи
    article = relationship("Article", back_populates="authors", foreign_keys=[article_id])
    user_employee = relationship("User", back_populates="authored_articles")


class EmployeeArticle(Base):
    __tablename__ = "employee_articles"

    employee_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    article_id = Column(Integer, ForeignKey("articles.id"), primary_key=True)
    created_at = Column(DateTime, default=func.now())

    # Связи
    employee = relationship("User", overlaps="employees")
    article = relationship("Article", overlaps="employees")