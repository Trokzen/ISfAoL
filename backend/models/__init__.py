from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base

# Указываем схему по умолчанию
metadata = MetaData(schema="elibrary")

Base = declarative_base(metadata=metadata)

from .user import User
from .article import Article, Author
from .employee import Employee
from .department import Department

__all__ = ["User", "Article", "Author", "Employee", "Department"]