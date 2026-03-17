from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base

# Указываем схему по умолчанию
metadata = MetaData(schema="elibrary")

Base = declarative_base(metadata=metadata)

from .article import User, Article, Author, Department, UserDepartment, EmployeeArticle

__all__ = ["User", "Article", "Author", "Department", "UserDepartment", "EmployeeArticle"]