from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    login: str
    password: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    login: str
    role: str
    email: Optional[str] = None
    full_name: Optional[str] = None

    class Config:
        from_attributes = True