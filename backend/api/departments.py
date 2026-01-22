from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.department import Department
from models.employee import Employee
from schemas.department import DepartmentCreate, DepartmentOut

router = APIRouter()

@router.get("/", response_model=list[DepartmentOut])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.post("/", response_model=DepartmentOut)
def create_department(dept_data: DepartmentCreate, db: Session = Depends(get_db)):
    existing = db.query(Department).filter(Department.name == dept_data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Department already exists")
    
    dept = Department(name=dept_data.name)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.get("/{id}/employees")
def get_department_employees(id: int, db: Session = Depends(get_db)):
    employees = db.query(Employee).join(Employee.departments).filter(Department.id == id).all()
    return employees