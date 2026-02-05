from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import registry
from models import Base

# Создаем реестр для промежуточных таблиц
metadata = Base.metadata

# Промежуточная таблица для связи многие-ко-многим между сотрудниками и подразделениями
employee_departments = Table('employee_departments', metadata,
    Column('employee_id', Integer, ForeignKey('elibrary.employees.id'), primary_key=True),
    Column('department_id', Integer, ForeignKey('elibrary.departments.id'), primary_key=True)
)

# Промежуточная таблица для связи многие-ко-многим между сотрудниками и статьями
employee_articles = Table('employee_articles', metadata,
    Column('employee_id', Integer, ForeignKey('elibrary.employees.id'), primary_key=True),
    Column('article_id', Integer, ForeignKey('elibrary.articles.id'), primary_key=True)
)