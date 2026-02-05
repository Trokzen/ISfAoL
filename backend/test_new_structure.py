from database import SessionLocal
from models.employee import Employee
from models.department import Department
from models.article import Article
from models.user import User
from models.associations import employee_departments, employee_articles

def test_new_structure():
    db = SessionLocal()
    try:
        # Проверим, что новые таблицы существуют и работают
        print("=== Тестирование новой структуры БД ===")
        
        # Проверим существующих пользователей
        users = db.query(User).all()
        print(f"Найдено пользователей: {len(users)}")
        for user in users[:2]:  # Показываем первых 2
            print(f"  - {user.login} (ID: {user.id}, роль: {user.role})")
        
        # Проверим существующих сотрудников
        employees = db.query(Employee).all()
        print(f"\nНайдено сотрудников: {len(employees)}")
        for emp in employees[:2]:  # Показываем первых 2
            print(f"  - {emp.fio} (ID: {emp.id})")
        
        # Проверим существующие статьи
        articles = db.query(Article).all()
        print(f"\nНайдено статей: {len(articles)}")
        for art in articles[:2]:  # Показываем первых 2
            print(f"  - {art.title} (ID: {art.id}, год: {art.year_pub})")
            print(f"    Авторов: {len(art.authors)}, Сотрудников: {len(art.employees)}")
        
        # Проверим существующие подразделения
        depts = db.query(Department).all()
        print(f"\nНайдено подразделений: {len(depts)}")
        for dept in depts[:2]:  # Показываем первых 2
            print(f"  - {dept.name} (ID: {dept.id})")
            print(f"    Сотрудников: {len(dept.employees)}")
        
        # Попробуем создать связи
        if employees and articles:
            emp = employees[0]
            art = articles[0]
            print(f"\nТестирование связи сотрудника {emp.fio} со статьей {art.title}")
            
            # Проверим текущие связи
            print(f"  До: сотрудник связан с {len(emp.articles)} статьями")
            print(f"  До: статья связана с {len(art.employees)} сотрудниками")
            
            # Добавим связь
            if art not in emp.articles:
                emp.articles.append(art)
                db.commit()
                print(f"  Связь добавлена")
            
            # Проверим связи снова
            db.expire(emp)  # Обновляем объект из БД
            db.expire(art)
            print(f"  После: сотрудник связан с {len(emp.articles)} статьями")
            print(f"  После: статья связана с {len(art.employees)} сотрудниками")
        
        print("\n=== Тестирование завершено успешно ===")
        
    except Exception as e:
        print(f"Ошибка при тестировании: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_new_structure()