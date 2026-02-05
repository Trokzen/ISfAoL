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

def check_missing_tables():
    try:
        db = SessionLocal()

        # Проверим, существуют ли таблицы, упомянутые в SQL-файле, но не показанные ранее
        expected_tables = ['employee_departments', 'employee_articles']
        
        for table in expected_tables:
            result = db.execute(text(f"""
                SELECT EXISTS (
                   SELECT FROM information_schema.tables 
                   WHERE table_schema = 'elibrary' 
                   AND table_name = '{table}'
                );
            """))
            exists = result.fetchone()[0]
            
            print(f"Таблица {table} {'существует' if exists else 'НЕ существует'}")
            
            if exists:
                # Получим структуру таблицы
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
                
                print(f"  Структура {table}:")
                for col in columns:
                    print(f"    - {col[0]}: {col[1]} (nullable: {col[2]}, default: {col[3]})")
                
                # Получим внешние ключи для таблицы
                fk_result = db.execute(text(f"""
                    SELECT 
                        kcu.column_name,
                        ccu.table_name AS foreign_table_name,
                        ccu.column_name AS foreign_column_name
                    FROM information_schema.table_constraints tc
                    JOIN information_schema.key_column_usage kcu
                        ON tc.constraint_name = kcu.constraint_name
                        AND tc.table_schema = kcu.table_schema
                    JOIN information_schema.constraint_column_usage ccu
                        ON ccu.constraint_name = tc.constraint_name
                        AND ccu.table_schema = tc.table_schema
                    WHERE tc.constraint_type = 'FOREIGN KEY' 
                        AND tc.table_name = '{table}'
                        AND tc.table_schema = 'elibrary';
                """))
                foreign_keys = fk_result.fetchall()
                
                if foreign_keys:
                    print("  Внешние ключи:")
                    for fk in foreign_keys:
                        print(f"    - {fk[0]} -> {fk[1]}.{fk[2]}")
        
        db.close()

    except Exception as e:
        print(f"Ошибка при проверке таблиц: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_missing_tables()