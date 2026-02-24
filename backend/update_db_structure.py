import psycopg2
from dotenv import load_dotenv
import os

# Загружаем переменные окружения
load_dotenv()

# Подключение к базе данных
conn = psycopg2.connect(
    host="localhost",
    database="postgres",
    user="postgres",
    password="1234"
)

try:
    cursor = conn.cursor()
    
    # Добавляем поле fio в таблицу users
    print("Добавляем поле fio в таблицу users...")
    cursor.execute("""
        ALTER TABLE elibrary.users ADD COLUMN IF NOT EXISTS fio VARCHAR(255);
    """)
    
    # Обновляем существующие записи, чтобы fio совпадало с full_name
    print("Обновляем существующие записи...")
    cursor.execute("""
        UPDATE elibrary.users SET fio = full_name WHERE fio IS NULL;
    """)
    
    conn.commit()
    print("Структура таблицы users успешно обновлена!")
    
    # Проверим, что поле добавлено
    cursor.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'elibrary' 
        AND table_name = 'users' 
        AND column_name = 'fio';
    """)
    
    result = cursor.fetchone()
    if result:
        print(f"Поле fio успешно добавлено: {result}")
    else:
        print("Поле fio не найдено после обновления")
        
    cursor.close()
    
except Exception as e:
    print(f"Ошибка при обновлении структуры базы данных: {e}")
    conn.rollback()
    
finally:
    conn.close()