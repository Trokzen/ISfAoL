from database import SessionLocal
from models.user import User
from api.deps import get_current_user
from jose import jwt
import os
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "85duanGAODWoizkbdd3EIBFHYz4qkqVZeXNbUlmPh2E")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def test_token_decoding():
    """Тестируем создание и декодирование токена"""
    print("=== Тестирование создания и декодирования токена ===")
    
    # Создаем тестовый токен как это делает auth.py
    from datetime import datetime, timedelta
    
    data = {"sub": "test", "role": "user"}
    expire = datetime.utcnow() + timedelta(minutes=30)
    data.update({"exp": expire})
    
    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    print(f"Созданный токен: {token[:50]}...")
    
    # Проверяем декодирование токена как это делает deps.py
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print(f"Декодированный payload: {payload}")
        
        login: str = payload.get("sub")
        role: str = payload.get("role")
        print(f"Login: {login}, Role: {role}")
        
        # Проверяем получение пользователя из БД
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.login == login).first()
            if user:
                print(f"Пользователь найден в БД: {user.login}, роль: {user.role}")
            else:
                print("Пользователь НЕ найден в БД")
        finally:
            db.close()
        
        print("✓ Тестирование токена прошло успешно")
        
    except Exception as e:
        print(f"✗ Ошибка при декодировании токена: {e}")
        import traceback
        traceback.print_exc()

def test_deps_function():
    """Тестируем функцию из deps.py напрямую"""
    print("\n=== Тестирование функции get_current_user ===")
    
    # Создаем токен
    from datetime import datetime, timedelta
    
    data = {"sub": "test", "role": "user"}
    expire = datetime.utcnow() + timedelta(minutes=30)
    data.update({"exp": expire})
    
    token = jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)
    
    # Имитируем работу зависимости
    db = SessionLocal()
    try:
        # Вызываем функцию как это делает FastAPI
        user = get_current_user(token=token, db=db)
        print(f"Пользователь получен через deps: {user.login}, роль: {user.role}")
        print("✓ Функция get_current_user работает корректно")
    except Exception as e:
        print(f"✗ Ошибка в функции get_current_user: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_token_decoding()
    test_deps_function()