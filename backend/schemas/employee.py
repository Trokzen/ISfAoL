from pydantic import BaseModel
from typing import List, Optional

class EmployeeOut(BaseModel):
    id: int
    login: str
    email: Optional[str]
    full_name: str

    class Config:
        from_attributes = True

class EmployeeCreate(BaseModel):
    login: str
    password: str
    email: Optional[str]
    full_name: str
    id_elibrary_user: Optional[str] = None

    class Config:
        from_attributes = True

class EmployeeUpdate(BaseModel):
    full_name: str
    id_elibrary_user: Optional[str] = None
    email: Optional[str]

    class Config:
        from_attributes = True

class EmployeeCreateExtended(BaseModel):
    login: str
    password: str
    email: Optional[str]
    full_name: str
    id_elibrary_user: Optional[str] = None
    department_ids: List[int]
    primary_department_id: Optional[int] = None
    position_title: Optional[str] = ""

    class Config:
        from_attributes = True

class EmployeeCreateWithDetails(BaseModel):
    login: str
    password: str
    email: Optional[str]
    full_name: str
    id_elibrary_user: Optional[str] = None
    department_ids: List[int]
    primary_department_id: Optional[int] = None
    position_title: Optional[str] = ""

    def get_fio(self) -> str:
        return self.full_name