from pydantic import BaseModel
from typing import List, Optional

class AuthorOut(BaseModel):
    id: int
    article_id: int
    author_name: str
    contribution: float
    applied_for_award: bool
    award_applied_date: Optional[str]

    class Config:
        from_attributes = True

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