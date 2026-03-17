from fastapi import APIRouter, Depends, HTTPException, Path
from sqlalchemy.orm import Session
from database import get_db
from models.article import Department, User, Article
from schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentOut
from api.deps import get_current_active_user, get_current_admin_user, get_current_manager_user, get_department_manager_or_admin

router = APIRouter()

@router.get("/", response_model=list[DepartmentOut])
def get_departments(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm import selectinload
    
    departments = db.query(Department).options(
        selectinload(Department.users)
    ).offset(skip).limit(limit).all()
    return departments

@router.get("/{dept_id}", response_model=DepartmentOut)
def get_department(dept_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.orm import selectinload
    
    department = db.query(Department).options(
        selectinload(Department.users)
    ).filter(Department.id == dept_id).first()
    
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    return department

@router.post("/", response_model=DepartmentOut)
def create_department(
    dept_data: DepartmentCreate,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли уже подразделение с таким названием
    existing_dept = db.query(Department).filter(Department.name == dept_data.name).first()
    if existing_dept:
        raise HTTPException(status_code=400, detail="Department with this name already exists")

    # Проверяем, существует ли менеджер с указанным ID
    manager = None
    if dept_data.manager_id:
        manager = db.query(User).filter(User.id == dept_data.manager_id).first()
        if not manager:
            raise HTTPException(status_code=404, detail="Manager not found")
        
        # Устанавливаем роль пользователя как manager, если она отличается
        if manager.role != "manager":
            manager.role = "manager"
            db.commit()

    dept = Department(
        name=dept_data.name,
        manager_id=dept_data.manager_id
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept

@router.put("/{dept_id}", response_model=DepartmentOut)
def update_department(
    dept_id: int,
    dept_data: DepartmentUpdate,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Если меняется менеджер подразделения
    if department.manager_id != dept_data.manager_id:
        # Если у подразделения был старый менеджер, понижаем его роль до user
        if department.manager_id:
            old_manager = db.query(User).filter(User.id == department.manager_id).first()
            if old_manager and old_manager.role == "manager":
                # Проверяем, является ли старый менеджер менеджером других подразделений
                other_managed_departments = db.query(Department).filter(
                    Department.manager_id == department.manager_id,
                    Department.id != dept_id
                ).count()
                
                # Если старый менеджер не управляет другими подразделениями, понижаем его роль
                if other_managed_departments == 0:
                    old_manager.role = "user"
        
        # Если указан новый менеджер, устанавливаем ему роль manager
        if dept_data.manager_id:
            new_manager = db.query(User).filter(User.id == dept_data.manager_id).first()
            if not new_manager:
                raise HTTPException(status_code=404, detail="Manager not found")
            
            # Устанавливаем роль пользователя как manager, если она отличается
            if new_manager.role != "manager":
                new_manager.role = "manager"

    department.name = dept_data.name
    department.manager_id = dept_data.manager_id

    db.commit()
    db.refresh(department)
    return department

@router.delete("/{dept_id}")
def delete_department(
    dept_id: int,
    current_user: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Проверяем, не связано ли подразделение с какими-либо пользователями
    from models.article import UserDepartment
    user_depts = db.query(UserDepartment).filter(UserDepartment.department_id == dept_id).count()
    if user_depts > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete department that has associated users. Remove user associations first."
        )

    db.delete(department)
    db.commit()
    return {"status": "success"}

# Маршруты для управления пользователями в подразделении
@router.post("/{dept_id}/employees/{employee_id}")
def add_employee_to_department(
    dept_id: int = Path(..., ge=1),  # Проверяем, что ID положительный
    employee_id: int = Path(..., ge=1),
    is_primary: bool = False,
    position_title: str = "",
    current_user: dict = Depends(lambda dept_id=Path(..., ge=1), db=Depends(get_db): get_department_manager_or_admin(dept_id, db=db)),  # Менеджер конкретного подразделения или администратор
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли подразделение
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Проверяем, существует ли пользователь
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Проверяем, не добавлен ли уже пользователь в это подразделение
    from models.article import UserDepartment
    existing_assoc = db.query(UserDepartment).filter(
        UserDepartment.user_id == employee_id,
        UserDepartment.department_id == dept_id
    ).first()

    if existing_assoc:
        raise HTTPException(status_code=400, detail="Employee is already associated with this department")

    # Добавляем связь
    user_dept = UserDepartment(
        user_id=employee_id,
        department_id=dept_id,
        is_primary=is_primary,
        position_title=position_title
    )
    db.add(user_dept)
    db.commit()
    return {"status": "success"}

@router.delete("/{dept_id}/employees/{employee_id}")
def remove_employee_from_department(
    dept_id: int = Path(..., ge=1),
    employee_id: int = Path(..., ge=1),
    current_user: dict = Depends(lambda dept_id=Path(..., ge=1), db=Depends(get_db): get_department_manager_or_admin(dept_id, db=db)),  # Менеджер конкретного подразделения или администратор
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли подразделение
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Проверяем, существует ли пользователь
    employee = db.query(User).filter(User.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Удаляем связь
    from models.article import UserDepartment
    assoc = db.query(UserDepartment).filter(
        UserDepartment.user_id == employee_id,
        UserDepartment.department_id == dept_id
    ).first()

    if not assoc:
        raise HTTPException(status_code=404, detail="Employee is not associated with this department")

    db.delete(assoc)
    db.commit()
    return {"status": "success"}

@router.get("/{dept_id}/employees")
def get_department_employees(
    dept_id: int = Path(..., ge=1),
    current_user: dict = Depends(lambda dept_id=Path(..., ge=1), db=Depends(get_db): get_department_manager_or_admin(dept_id, db=db)),  # Менеджер конкретного подразделения или администратор
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли подразделение
    department = db.query(Department).filter(Department.id == dept_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    # Получаем пользователей, связанных с подразделением
    from models.article import UserDepartment
    user_depts = db.query(UserDepartment).filter(UserDepartment.department_id == dept_id).all()

    employee_ids = [ud.user_id for ud in user_depts]
    employees = db.query(User).filter(User.id.in_(employee_ids)).all()

    return employees