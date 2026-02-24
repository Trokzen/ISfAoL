from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.article import User, Department, UserDepartment, Article
from schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut, EmployeeCreateExtended, EmployeeCreateWithDetails
from api.deps import get_current_active_user, get_current_admin_user
from passlib.context import CryptContext

# Создаем контекст для хеширования паролей
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

router = APIRouter()

@router.get("/", response_model=list[EmployeeOut])
def get_employees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    employees = db.query(User).offset(skip).limit(limit).all()
    return employees

@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("/", response_model=EmployeeOut)
def create_employee(
    emp_data: EmployeeCreateExtended,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Создаем нового пользователя-сотрудника
    emp = User(
        login=emp_data.login,
        password_hash=get_password_hash(emp_data.password),  # Хешируем пароль
        email=emp_data.email,
        full_name=emp_data.full_name,
        id_elibrary_user=emp_data.id_elibrary_user or emp_data.full_name  # Если id_elibrary_user не указано, используем full_name
    )
    db.add(emp)
    db.flush()

    # Привязываем к подразделениям
    for dept_id in emp_data.department_ids:
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if dept:
            user_dept = UserDepartment(
                user_id=emp.id,
                department_id=dept_id,
                is_primary=emp_data.primary_department_id == dept_id if emp_data.primary_department_id else False,
                position_title=emp_data.position_title
            )
            db.add(user_dept)

    db.commit()
    db.refresh(emp)
    return emp

# Дополнительный эндпоинт для создания сотрудника с деталями
@router.post("/with-details", response_model=EmployeeOut)
def create_employee_with_details(
    emp_data: EmployeeCreateWithDetails,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    emp = User(
        login=emp_data.login,
        password_hash=get_password_hash(emp_data.password),  # Хешируем пароль
        email=emp_data.email,
        full_name=emp_data.full_name,
        id_elibrary_user=emp_data.id_elibrary_user or emp_data.full_name  # Если id_elibrary_user не указано, используем full_name
    )
    db.add(emp)
    db.flush()

    # Привязываем к подразделениям
    for dept_id in emp_data.department_ids:
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if dept:
            user_dept = UserDepartment(
                user_id=emp.id,
                department_id=dept_id,
                is_primary=emp_data.primary_department_id == dept_id if emp_data.primary_department_id else False,
                position_title=emp_data.position_title
            )
            db.add(user_dept)

    db.commit()
    db.refresh(emp)
    return emp

@router.put("/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int,
    emp_data: EmployeeUpdate,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Обновляем данные сотрудника
    employee.full_name = emp_data.full_name
    employee.fio = emp_data.fio
    employee.email = emp_data.email
    
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()
    return {"status": "success"}

# Маршруты для связи сотрудников со статьями
@router.post("/{employee_id}/articles/{article_id}")
def link_employee_to_article(
    employee_id: int,
    article_id: int,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Проверяем, существуют ли сотрудник и статья
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Проверяем, не связана ли уже эта пара
    from models.article import EmployeeArticle
    existing_link = db.query(EmployeeArticle).filter(
        (EmployeeArticle.employee_id == employee_id) &
        (EmployeeArticle.article_id == article_id)
    ).first()

    if existing_link:
        raise HTTPException(status_code=400, detail="Employee is already linked to this article")

    # Связываем сотрудника со статьей
    emp_article = EmployeeArticle(
        employee_id=employee_id,
        article_id=article_id
    )
    db.add(emp_article)
    db.commit()
    return {"status": "success"}

@router.delete("/{employee_id}/articles/{article_id}")
def unlink_employee_from_article(
    employee_id: int,
    article_id: int,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Проверяем, существуют ли сотрудник и статья
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Удаляем связь
    from models.article import EmployeeArticle
    link = db.query(EmployeeArticle).filter(
        (EmployeeArticle.employee_id == employee_id) &
        (EmployeeArticle.article_id == article_id)
    ).first()
    
    if link:
        db.delete(link)
        db.commit()
    return {"status": "success"}

@router.get("/{employee_id}/articles")
def get_employee_articles(
    employee_id: int,
    db: Session = Depends(get_db)
):
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Получаем статьи, в которых сотрудник является автором
    from models.article import Author
    articles_by_authorship = db.query(Article).join(Author).filter(
        Author.user_employee_id == employee_id
    ).all()

    # Получаем статьи, с которыми сотрудник связан через промежуточную таблицу
    from models.article import EmployeeArticle
    articles_by_link = db.query(Article).join(EmployeeArticle).filter(
        EmployeeArticle.employee_id == employee_id
    ).all()

    # Объединяем и убираем дубликаты
    all_articles = list(set(articles_by_authorship + articles_by_link))
    
    return all_articles