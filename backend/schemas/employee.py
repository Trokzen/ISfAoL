from pydantic import BaseModel
from typing import List, Optional

class EmployeeBase(BaseModel):
    fio: str

class EmployeeCreate(EmployeeBase):
    department_ids: List[int] = []

class EmployeeCreateExtended(BaseModel):
    fio: str
    department_ids: List[int] = []

class EmployeeCreateWithDetails(BaseModel):
    first_name: str
    last_name: str
    middle_name: Optional[str] = None
    department_ids: List[int] = []
    position: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    employee_id: Optional[int] = None

    def get_fio(self) -> str:
        middle = f" {self.middle_name}" if self.middle_name else ""
        return f"{self.last_name} {self.first_name}{middle}"

class EmployeeUpdate(EmployeeBase):
    pass

class EmployeeOut(EmployeeBase):
    id: int

    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str
    manager_id: Optional[int] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(DepartmentBase):
    pass

class DepartmentOut(DepartmentBase):
    id: int
    employees: List[EmployeeOut] = []

    class Config:
        from_attributes = True