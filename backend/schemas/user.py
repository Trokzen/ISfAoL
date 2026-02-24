from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    login: str
    password: str
    email: Optional[str] = None
    full_name: str
    id_elibrary_user: Optional[str] = None  # Будет использоваться для id пользователя elibrary
    department_id: Optional[int] = None  # ID подразделения, которым будет управлять менеджер

class UserOut(BaseModel):
    id: int
    login: str
    role: str
    email: Optional[str] = None
    full_name: str
    id_elibrary_user: Optional[str] = None

    class Config:
        from_attributes = True