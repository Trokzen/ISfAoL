"""
Модуль подключения к базе данных.

Использует конфигурацию из config.database для создания движка SQLAlchemy.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
from models import Base  # Импортируем Base из models
from config.database import db_config

# Создаём движок SQLAlchemy с использованием конфигурации
engine = create_engine(
    db_config.url,
    echo=db_config.echo,  # Логирование SQL (если включено)
    pool_size=db_config.pool_size,
    max_overflow=db_config.max_overflow
)

@event.listens_for(engine, "connect")
def set_search_path(dbapi_connection, connection_record):
    with dbapi_connection.cursor() as cursor:
        cursor.execute("SET search_path TO elibrary")  # <-- указываем схему

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Генератор для получения сессии базы данных.
    
    Использование:
        db = next(get_db())
        try:
            # работа с БД
        finally:
            db.close()
    
    Или через Depends в FastAPI:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
