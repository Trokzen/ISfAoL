from pydantic import BaseModel
from typing import List, Optional

class EmployeeOut(BaseModel):
    id: int
    login: str
    email: Optional[str]
    full_name: str

    class Config:
        from_attributes = True

class DepartmentOut(BaseModel):
    id: int
    name: str
    manager_id: Optional[int]
    users: List[EmployeeOut] = []  # Используем "users" вместо "employees", как в модели

    class Config:
        from_attributes = True

class DepartmentCreate(BaseModel):
    name: str
    manager_id: Optional[int] = None

    class Config:
        from_attributes = True

class DepartmentUpdate(BaseModel):
    name: str
    manager_id: Optional[int] = None

    class Config:
        from_attributes = True