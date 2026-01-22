from pydantic import BaseModel
from typing import List

class EmployeeCreate(BaseModel):
    fio: str
    department_ids: List[int]

class EmployeeOut(BaseModel):
    id: int
    fio: str
    departments: List[str]

    class Config:
        from_attributes = True