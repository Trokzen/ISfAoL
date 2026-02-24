from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.article import User
from api.auth import get_password_hash
from models import Base

# Подключение к базе данных
DATABASE_URL = "postgresql://postgres:1234@localhost/postgres"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Создаем сессию
db = SessionLocal()

try:
    # Проверяем, существует ли уже пользователь admin
    existing_user = db.query(User).filter(User.login == "admin").first()
    
    if existing_user:
        print(f"Пользователь admin уже существует с ID: {existing_user.id}")
        # Обновляем пароль для существующего пользователя
        existing_user.password_hash = get_password_hash("admin")
        existing_user.role = "admin"
        db.commit()
        print("Пароль для пользователя admin обновлен")
    else:
        # Создаем нового администратора
        admin_user = User(
            login="admin",
            password_hash=get_password_hash("admin"),
            role="admin",
            full_name="Администратор Системы",
            fio="Администратор Системы",
            id_elibrary_user="admin_user"
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        print(f"Создан новый администратор с ID: {admin_user.id}")
        
    # Проверяем, есть ли другие пользователи
    all_users = db.query(User).all()
    print(f"Всего пользователей в системе: {len(all_users)}")
    for user in all_users:
        print(f"- ID: {user.id}, Логин: {user.login}, Роль: {user.role}, ФИО: {user.full_name}")
        
finally:
    db.close()