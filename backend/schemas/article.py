from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class AuthorOut(BaseModel):
    id: int
    article_id: int
    author_name: str
    contribution: float
    applied_for_award: bool
    award_applied_date: Optional[date]  # Изменили на Optional[date]

    class Config:
        from_attributes = True
        json_encoders = {
            date: lambda v: v.isoformat() if v else None  # Конвертируем дату в ISO строку при сериализации
        }

class ArticleOut(BaseModel):
    id: int
    title: str
    year_pub: int
    in_rinc: bool
    authors: List[AuthorOut]

    class Config:
        from_attributes = True

class AuthorUpdate(BaseModel):
    id: int
    contribution: float
    applied_for_award: bool
    award_applied_date: Optional[str]