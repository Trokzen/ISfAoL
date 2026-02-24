from sqlalchemy import create_engine, inspect
from database import engine
from models import Base
from models.article import Article, Author
from models.user import User
from models.employee import Employee
from models.department import Department
from models.associations import employee_departments, employee_articles

def generate_db_schema():
    """Генерирует SQL-скрипт для создания структуры базы данных"""
    
    # Получаем инспектор для получения информации о таблицах
    inspector = inspect(engine)
    
    print("-- Структура базы данных для Elibrary --")
    print()
    
    # Получаем список всех таблиц
    tables = inspector.get_table_names()
    
    for table_name in tables:
        print(f"-- Таблица: {table_name} --")
        
        # Получаем информацию о столбцах
        columns = inspector.get_columns(table_name)
        
        print(f"CREATE TABLE {table_name} (")
        
        column_defs = []
        for col in columns:
            col_type = str(col['type'])
            nullable = "NOT NULL" if not col['nullable'] else ""
            default = f"DEFAULT {col['default']}" if col['default'] else ""
            
            col_def = f"  {col['name']} {col_type} {nullable} {default}".strip()
            column_defs.append(col_def)
        
        print(",\n".join(column_defs))
        print(");")
        print()
        
        # Получаем индексы
        indexes = inspector.get_indexes(table_name)
        for idx in indexes:
            print(f"CREATE INDEX {idx['name']} ON {table_name} ({', '.join(idx['column_names'])});")
        
        print()
        
        # Получаем внешние ключи
        foreign_keys = inspector.get_foreign_keys(table_name)
        for fk in foreign_keys:
            print(f"ALTER TABLE {table_name} ADD CONSTRAINT {fk['name']} "
                  f"FOREIGN KEY ({', '.join(fk['constrained_columns'])}) "
                  f"REFERENCES {fk['referred_table']} ({', '.join(fk['referred_columns'])});")
        
        print()
        print("-" * 50)
        print()

def generate_create_script_from_models():
    """Генерирует SQL-скрипт на основе моделей SQLAlchemy"""
    print("-- SQL-скрипт для создания таблиц на основе моделей --")
    print()
    
    # Получаем DDL (Data Definition Language) для всех таблиц
    from sqlalchemy.schema import CreateTable
    
    tables = [Article.__table__, Author.__table__, User.__table__, 
              Employee.__table__, Department.__table__, 
              employee_departments, employee_articles]
    
    for table in tables:
        print(CreateTable(table).compile(engine))
        print()

if __name__ == "__main__":
    print("=== Вариант 1: Информация из существующей базы данных ===")
    try:
        generate_db_schema()
    except Exception as e:
        print(f"Ошибка при получении информации из базы данных: {e}")
        print()
    
    print("\n=== Вариант 2: SQL-скрипт на основе моделей ===")
    try:
        generate_create_script_from_models()
    except Exception as e:
        print(f"Ошибка при генерации скрипта из моделей: {e}")