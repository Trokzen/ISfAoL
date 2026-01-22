from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.employee import Employee
from models.department import Department
from models.article import Article, Author
from schemas.employee import EmployeeCreate, EmployeeOut
from api.deps import get_current_active_user

router = APIRouter()

@router.post("/", response_model=EmployeeOut)
def create_employee(emp_data: EmployeeCreate, db: Session = Depends(get_db)):
    from models.employee import employee_departments
    
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

@router.get("/{id}/articles")
def get_employee_articles(id: int, db: Session = Depends(get_db)):
    articles = db.query(Article).join(Author).filter(Author.employee_id == id).all()
    return articles