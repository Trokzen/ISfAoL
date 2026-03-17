from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class AuthorOut(BaseModel):
    id: int
    article_id: int
    author_name: str
    user_employee_id: Optional[int] = None  # ID сотрудника (если это внутренний автор)
    contribution: float
    applied_for_award: bool
    award_applied_date: Optional[str]  # Изменили на Optional[str] для корректной сериализации

    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.isoformat() if v else None  # Конвертируем дату в ISO строку при сериализации
        }

class EmployeeOut(BaseModel):
    id: int
    fio: str
    full_name: str

    class Config:
        from_attributes = True

class ArticleOut(BaseModel):
    id: int
    external_id: Optional[int] = None  # ID из внешней системы elibrary
    title: str
    year_pub: int
    in_rinc: bool
    authors: List[AuthorOut]
    employees: List[EmployeeOut]  # Добавляем сотрудников, связанных со статьей

    class Config:
        from_attributes = True

class AuthorUpdate(BaseModel):
    id: int
    contribution: float
    applied_for_award: bool
    award_applied_date: Optional[str]

class AuthorCreate(BaseModel):
    author_name: str
    user_employee_id: Optional[int] = None  # ID сотрудника (если это внутренний автор)
    contribution: float
    applied_for_award: bool
    award_applied_date: Optional[str] = None

class ArticleCreate(BaseModel):
    id: Optional[int] = None  # Внутренний ID (автоинкремент)
    external_id: Optional[int] = None  # ID из внешней системы elibrary
    title: str
    year_pub: int
    in_rinc: bool
    authors: List[AuthorCreate]
    employee_ids: List[int] = []  # Список ID сотрудников, связанных со статьей