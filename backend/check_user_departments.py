from database import get_db
from models.article import UserDepartment, User, Department

# Создаем сессию базы данных
db_gen = get_db()
db = next(db_gen)

try:
    # Проверяем, есть ли записи в таблице user_departments
    associations = db.query(UserDepartment).all()
    print(f"Total user-department associations in database: {len(associations)}")
    for assoc in associations:
        user = db.query(User).filter(User.id == assoc.user_id).first()
        dept = db.query(Department).filter(Department.id == assoc.department_id).first()
        print(f"  - User: {user.full_name if user else 'Unknown'} (ID: {assoc.user_id}) -> Dept: {dept.name if dept else 'Unknown'} (ID: {assoc.department_id}), Primary: {assoc.is_primary}")

    # Также проверим конкретного пользователя (например, с ID 5, как в вашем примере)
    user_id = 5
    user_assocs = db.query(UserDepartment).filter(UserDepartment.user_id == user_id).all()
    print(f"\nAssociations for user ID {user_id}:")
    for assoc in user_assocs:
        dept = db.query(Department).filter(Department.id == assoc.department_id).first()
        print(f"  - Belongs to department: {dept.name if dept else 'Unknown'} (ID: {assoc.department_id}), Primary: {assoc.is_primary}")

    # Проверим конкретное подразделение (например, с ID 1, как в вашем примере)
    dept_id = 1
    dept_assocs = db.query(UserDepartment).filter(UserDepartment.department_id == dept_id).all()
    print(f"\nAssociations for department ID {dept_id}:")
    for assoc in dept_assocs:
        user = db.query(User).filter(User.id == assoc.user_id).first()
        print(f"  - Has user: {user.full_name if user else 'Unknown'} (ID: {assoc.user_id}), Primary: {assoc.is_primary}")

finally:
    db.close()