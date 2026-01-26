from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.article import Article, Author
from schemas.article import ArticleOut, AuthorUpdate
from api.deps import get_current_active_user
import urllib.parse

router = APIRouter()

# Модель для ответа с пагинацией
from pydantic import BaseModel
from typing import List, Optional

class PaginatedArticlesResponse(BaseModel):
    articles: List[ArticleOut]
    total: int
    page: int
    pages: int
    per_page: int

import re

@router.get("/", response_model=PaginatedArticlesResponse)
def get_articles(
    page: int = 1,
    per_page: int = 50,
    search_id: Optional[int] = None,
    search_title: Optional[str] = None,
    search_author: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Декодируем параметры, если они закодированы в URL
    if search_title:
        try:
            # Используем unquote для корректной обработки кириллических символов
            search_title = urllib.parse.unquote(search_title, encoding='utf-8')
        except:
            pass  # Если не удается декодировать, используем как есть

    if search_author:
        try:
            # Используем unquote для корректной обработки кириллических символов
            search_author = urllib.parse.unquote(search_author, encoding='utf-8')
        except:
            pass  # Если не удается декодировать, используем как есть
    # Ограничиваем максимальное количество статей на странице
    if per_page > 100:
        per_page = 100

    # Защита от отрицательных значений
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 1

    # Ограничение на максимально возможный номер страницы для предотвращения ошибок
    MAX_PAGE = 1000  # Устанавливаем максимальное значение страницы
    if page > MAX_PAGE:
        page = MAX_PAGE

    # Вычисляем offset
    skip = (page - 1) * per_page

    # Формируем запрос
    query = db.query(Article)
    if search_id:
        query = query.filter(Article.id == search_id)
    if search_title:
        query = query.filter(Article.title.ilike(f"%{search_title or ''}%"))
    if search_author:
        # Поиск по автору - используем relationship вместо join
        query = query.filter(Article.authors.any(Author.author_name.ilike(f"%{search_author or ''}%")))

    # Получаем общее количество
    total = query.count()

    # Защита от выхода за границы
    if total > 0 and skip >= total:
        # Если запрашиваемая страница за пределами доступных данных,
        # возвращаем последнюю доступную страницу
        page = max(1, ((total - 1) // per_page) + 1)
        skip = ((page - 1) * per_page)

    # Получаем статьи для текущей страницы
    articles = query.offset(skip).limit(per_page).all()

    # Вычисляем количество страниц
    pages = max(1, (total + per_page - 1) // per_page)  # Округление вверх

    return {
        "articles": articles,
        "total": total,
        "page": page,
        "pages": pages,
        "per_page": per_page
    }

@router.get("/{id}", response_model=ArticleOut)
def get_article(id: int, db: Session = Depends(get_db)):
    print(f"Searching for article with ID: {id}")
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        print(f"Article with ID {id} not found in DB!")
        raise HTTPException(status_code=404, detail="Article not found")
    print(f"Found article: {article.id}, {article.title}")
    return article

@router.put("/authors/bulk-update")
def update_authors_bulk(updates: list[AuthorUpdate], db: Session = Depends(get_db)):
    for update in updates:
        author = db.query(Author).filter(Author.id == update.id).first()
        if author:
            author.contribution = update.contribution
            author.applied_for_award = update.applied_for_award
            author.award_applied_date = update.award_applied_date
    db.commit()
    return {"status": "success"}