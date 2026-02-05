from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.employee import Employee
from models.department import Department
from models.article import Article
from schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut, EmployeeCreateExtended, EmployeeCreateWithDetails
from api.deps import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.get("/", response_model=list[EmployeeOut])
def get_employees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    employees = db.query(Employee).offset(skip).limit(limit).all()
    return employees

@router.get("/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee

@router.post("/", response_model=EmployeeOut)
def create_employee(
    emp_data: EmployeeCreateExtended,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    from models.associations import employee_departments

    emp = Employee(fio=emp_data.fio)
    db.add(emp)
    db.flush()

    for dept_id in emp_data.department_ids:
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if dept:
            db.execute(employee_departments.insert().values(
                employee_id=emp.id,
                department_id=dept_id
            ))

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
    from models.associations import employee_departments

    emp = Employee(fio=emp_data.get_fio())
    db.add(emp)
    db.flush()

    for dept_id in emp_data.department_ids:
        dept = db.query(Department).filter(Department.id == dept_id).first()
        if dept:
            db.execute(employee_departments.insert().values(
                employee_id=emp.id,
                department_id=dept_id
            ))

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
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    employee.fio = emp_data.fio
    db.commit()
    db.refresh(employee)
    return employee

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
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
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Проверяем, не связана ли уже эта пара
    from models.employee import employee_articles
    existing_link = db.execute(
        employee_articles.select().where(
            (employee_articles.c.employee_id == employee_id) & 
            (employee_articles.c.article_id == article_id)
        )
    ).fetchone()
    
    if existing_link:
        raise HTTPException(status_code=400, detail="Employee is already linked to this article")
    
    # Связываем сотрудника со статьей
    db.execute(employee_articles.insert().values(
        employee_id=employee_id,
        article_id=article_id
    ))
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
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Удаляем связь
    from models.employee import employee_articles
    db.execute(
        employee_articles.delete().where(
            (employee_articles.c.employee_id == employee_id) & 
            (employee_articles.c.article_id == article_id)
        )
    )
    db.commit()
    return {"status": "success"}

@router.get("/{employee_id}/articles")
def get_employee_articles(
    employee_id: int,
    db: Session = Depends(get_db)
):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    return employee.articles