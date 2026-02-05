from database import engine
from sqlalchemy import text

try:
    with engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))
        print("Connection to database successful")
        print("Result:", result.fetchone())
except Exception as e:
    print(f"Error connecting to database: {e}")