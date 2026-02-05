from database import get_db
from models.user import User

# Создаем сессию базы данных
db_gen = get_db()
db = next(db_gen)

try:
    # Проверяем, есть ли пользователь с логином "admin"
    user = db.query(User).filter(User.login == "admin").first()
    if user:
        print(f"User found: {user.login}, role: {user.role}")
    else:
        print("User 'admin' not found in database")
        
        # Проверим, есть ли вообще какие-то пользователи
        all_users = db.query(User).all()
        print(f"Total users in database: {len(all_users)}")
        for u in all_users:
            print(f"  - {u.login} (role: {u.role})")
finally:
    db.close()