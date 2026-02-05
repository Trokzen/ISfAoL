from database import SessionLocal
from models.user import User
from passlib.context import CryptContext

# Проверим, как выглядит хэш пароля у существующего пользователя
db = SessionLocal()
try:
    user = db.query(User).filter(User.login == "test").first()
    if user:
        print(f"User found: {user.login}")
        print(f"Password hash: {user.password_hash}")
        
        # Проверим, соответствует ли какой-то известный пароль этому хэшу
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        test_passwords = ["123456", "password", "test", "admin", "1234"]
        for pwd in test_passwords:
            if pwd_context.verify(pwd, user.password_hash):
                print(f"Match found! Password '{pwd}' matches the hash.")
                break
        else:
            print("No common passwords matched the hash.")
    else:
        print("Test user not found")
finally:
    db.close()