import psycopg2
from urllib.parse import quote_plus
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Подключаемся к базе данных
username = quote_plus('postgres')
password = quote_plus('1234')
dbname = quote_plus('postgres')

engine = create_engine(f'postgresql://{username}:{password}@localhost:5432/{dbname}?options=-csearch_path=elibrary')
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_missing_tables():
    try:
        db = SessionLocal()
        
        # Создаем таблицу employee_departments
        print("Создание таблицы employee_departments...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS elibrary.employee_departments (
                employee_id INTEGER NOT NULL,
                department_id INTEGER NOT NULL,
                PRIMARY KEY (employee_id, department_id),
                FOREIGN KEY (employee_id) REFERENCES elibrary.employees(id) ON DELETE CASCADE,
                FOREIGN KEY (department_id) REFERENCES elibrary.departments(id) ON DELETE CASCADE
            );
        """))
        
        # Создаем таблицу employee_articles
        print("Создание таблицы employee_articles...")
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS elibrary.employee_articles (
                employee_id INTEGER NOT NULL,
                article_id INTEGER NOT NULL,
                PRIMARY KEY (employee_id, article_id),
                FOREIGN KEY (employee_id) REFERENCES elibrary.employees(id) ON DELETE CASCADE,
                FOREIGN KEY (article_id) REFERENCES elibrary.articles(id) ON DELETE CASCADE
            );
        """))
        
        # Проверим, что таблицы созданы
        result = db.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'elibrary'
            AND table_name IN ('employee_departments', 'employee_articles')
            ORDER BY table_name;
        """))
        created_tables = [row[0] for row in result.fetchall()]
        print(f"Созданные/существующие таблицы: {created_tables}")
        
        # Проверим структуру новых таблиц
        for table in created_tables:
            print(f"\nСтруктура таблицы {table}:")
            result = db.execute(text(f"""
                SELECT 
                    column_name, 
                    data_type, 
                    is_nullable,
                    column_default
                FROM information_schema.columns
                WHERE table_name = '{table}' AND table_schema = 'elibrary'
                ORDER BY ordinal_position;
            """))
            columns = result.fetchall()
            for col in columns:
                print(f"  - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
        
        db.commit()
        db.close()
        print("\nТаблицы успешно созданы!")

    except Exception as e:
        print(f"Ошибка при создании таблиц: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    create_missing_tables()