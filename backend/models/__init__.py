from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base

# Указываем схему по умолчанию
metadata = MetaData(schema="elibrary")

Base = declarative_base(metadata=metadata)

from .user import User
from .article import Article, Author
from .employee import Employee
from .department import Department
from .associations import employee_departments, employee_articles

__all__ = ["User", "Article", "Author", "Employee", "Department", "employee_departments", "employee_articles"]