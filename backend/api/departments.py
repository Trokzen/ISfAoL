from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.department import Department
from models.employee import Employee
from schemas.employee import DepartmentCreate, DepartmentUpdate, DepartmentOut
from api.deps import get_current_active_user, get_current_admin_user

router = APIRouter()

@router.get("/", response_model=list[DepartmentOut])
def get_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    departments = db.query(Department).offset(skip).limit(limit).all()
    return departments

@router.get("/{dept_id}", response_model=DepartmentOut)
def get_department(dept_id: int, db: Session = Depends(get_db)):
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department

@router.post("/", response_model=DepartmentOut)
def create_department(
    dept: DepartmentCreate,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_dept = Department(name=dept.name, manager_id=dept.manager_id)
    db.add(db_dept)
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.put("/{dept_id}", response_model=DepartmentOut)
def update_department(
    dept_id: int,
    dept: DepartmentUpdate,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_dept = db.query(Department).filter(Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db_dept.name = dept.name
    db_dept.manager_id = dept.manager_id
    
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.delete("/{dept_id}")
def delete_department(
    dept_id: int,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Удаляем связи с сотрудниками перед удалением подразделения
    department.employees.clear()  # Это удалит все связи в промежуточной таблице
    
    db.delete(department)
    db.commit()
    return {"status": "success"}

# Маршруты для управления связями между подразделениями и сотрудниками
@router.post("/{dept_id}/employees/{employee_id}")
def add_employee_to_department(
    dept_id: int,
    employee_id: int,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Проверяем, существуют ли подразделение и сотрудник
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Проверяем, не связаны ли уже
    if department in employee.departments:
        raise HTTPException(status_code=400, detail="Employee is already in this department")
    
    # Добавляем сотрудника в подразделение
    employee.departments.append(department)
    db.commit()
    return {"status": "success"}

@router.delete("/{dept_id}/employees/{employee_id}")
def remove_employee_from_department(
    dept_id: int,
    employee_id: int,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Проверяем, существуют ли подразделение и сотрудник
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Удаляем связь
    if department in employee.departments:
        employee.departments.remove(department)
        db.commit()
    return {"status": "success"}

@router.get("/{dept_id}/employees")
def get_department_employees(
    dept_id: int,
    db: Session = Depends(get_db)
):
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return department.employees