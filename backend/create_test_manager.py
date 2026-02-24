from database import get_db
from models.article import User, Department
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'])

db_gen = get_db()
db = next(db_gen)

try:
    # Создаём менеджера
    manager = User(
        login="manager_test",
        password_hash=pwd_context.hash("manager123"),
        email="manager@test.com",
        role="manager",
        full_name="Менеджер Тестовый",
        id_elibrary_user="Менеджер Тестовый"
    )
    db.add(manager)
    db.commit()
    db.refresh(manager)
    
    # Назначаем его менеджером подразделения (например, ID 1)
    dept = db.query(Department).filter(Department.id == 1).first()
    if dept:
        dept.manager_id = manager.id
        db.commit()
        print(f"Менеджер создан и назначен для подразделения '{dept.name}'")
    else:
        print("Менеджер создан, но подразделение не найдено")
    
    print(f"\nЛогин: manager_test")
    print(f"Пароль: manager123")
    print(f"Роль: manager")
    
finally:
    db.close()
