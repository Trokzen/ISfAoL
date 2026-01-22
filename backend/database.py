from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
import urllib.parse

# Подключаемся к БД 'postgres', но используем схему 'elibrary'
username = urllib.parse.quote_plus("postgres")
password = urllib.parse.quote_plus("1234")
dbname = urllib.parse.quote_plus("postgres")  # <-- измените на 'postgres'

DATABASE_URL = f"postgresql://{username}:{password}@localhost/{dbname}"

engine = create_engine(DATABASE_URL)

@event.listens_for(engine, "connect")
def set_search_path(dbapi_connection, connection_record):
    with dbapi_connection.cursor() as cursor:
        cursor.execute("SET search_path TO elibrary")  # <-- указываем схему

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()