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

def test_simple_article_creation():
    try:
        db = SessionLocal()
        
        # Проверим, можем ли мы выполнить простой запрос
        result = db.execute(text("SELECT version();"))
        version = result.fetchone()
        print(f"+ PostgreSQL версия: {version[0][:50]}...")

        # Проверим, существуют ли таблицы
        result = db.execute(text("""
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'elibrary'
            ORDER BY table_name;
        """))
        tables = [row[0] for row in result.fetchall()]
        print(f"+ Таблицы в схеме elibrary: {tables}")

        # Проверим структуру таблицы articles
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'articles' AND table_schema = 'elibrary'
            ORDER BY ordinal_position;
        """))
        columns = result.fetchall()
        print("+ Структура таблицы articles:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")

        # Проверим структуру таблицы authors
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'authors' AND table_schema = 'elibrary'
            ORDER BY ordinal_position;
        """))
        columns = result.fetchall()
        print("+ Структура таблицы authors:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")

        # Проверим структуру таблицы users
        result = db.execute(text("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'users' AND table_schema = 'elibrary'
            ORDER BY ordinal_position;
        """))
        columns = result.fetchall()
        print("+ Структура таблицы users:")
        for col in columns:
            print(f"  - {col[0]}: {col[1]} (nullable: {col[2]})")

        db.close()
        print("+ Подключение к базе данных работает корректно")

    except Exception as e:
        print(f"- Ошибка при подключении к базе данных: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_simple_article_creation()