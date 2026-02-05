from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload, joinedload
from database import get_db
from models.article import Article, Author
from models.user import User
from schemas.article import ArticleOut, AuthorUpdate, AuthorCreate, ArticleCreate
from api.deps import get_current_active_user, get_current_admin_user, get_current_manager_user, check_user_can_edit_article
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
    articles = query.options(joinedload(Article.employees)).offset(skip).limit(per_page).all()

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
    article = db.query(Article).options(joinedload(Article.employees)).filter(Article.id == id).first()
    if not article:
        print(f"Article with ID {id} not found in DB!")
        raise HTTPException(status_code=404, detail="Article not found")
    print(f"Found article: {article.id}, {article.title}")
    return article

@router.put("/authors/bulk-update")
def update_authors_bulk(
    updates: list[AuthorUpdate],
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    for update in updates:
        # Получаем автора и связанную статью
        author = db.query(Author).filter(Author.id == update.id).first()
        if author:
            # Проверяем, может ли пользователь редактировать эту статью
            check_user_can_edit_article(current_user, author.article_id, db)

            # Обновляем поля
            author.contribution = update.contribution
            author.applied_for_award = update.applied_for_award
            author.award_applied_date = update.award_applied_date

    db.commit()
    return {"status": "success"}

# Модель для создания новой статьи
from pydantic import BaseModel
from typing import List, Optional
from datetime import date
from schemas.article import ArticleOut


@router.post("/", response_model=ArticleOut)
def create_article(
    article_data: ArticleCreate,
    current_user: User = Depends(get_current_active_user),  # Временно используем более простую проверку
    db: Session = Depends(get_db)
):
    print(f"create_article function called")
    print(f"Current user: {current_user.login}, role: {current_user.role}")
    print(f"Checking user permissions...")
    
    # Проверяем права вручную
    if current_user.role not in ["admin", "manager"]:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager privileges required"
        )
    
    print(f"User has required permissions: {current_user.role}")
    print(f"Article data received: {article_data.title}")
    
    try:
        # Создаем новую статью
        new_article = Article(
            title=article_data.title,
            year_pub=article_data.year_pub,
            in_rinc=article_data.in_rinc
        )
        db.add(new_article)
        db.flush()  # Чтобы получить ID статьи
        print(f"Created new article with ID: {new_article.id}")

        # Добавляем авторов
        for author_data in article_data.authors:
            # Преобразуем строку даты в объект date, если она предоставлена
            award_date = None
            if author_data.award_applied_date:
                from datetime import datetime
                try:
                    # Если строка даты в формате ISO (YYYY-MM-DD), преобразуем её
                    if isinstance(author_data.award_applied_date, str):
                        award_date = datetime.strptime(author_data.award_applied_date, '%Y-%m-%d').date()
                    else:
                        award_date = author_data.award_applied_date
                except (ValueError, TypeError):
                    # Если формат неверный или тип неподходящий, оставляем None
                    award_date = None

            new_author = Author(
                article_id=new_article.id,
                author_name=author_data.author_name,
                contribution=author_data.contribution,
                applied_for_award=author_data.applied_for_award,
                award_applied_date=award_date
            )
            db.add(new_author)
            print(f"Added author: {author_data.author_name} to article {new_article.id}")

        # Добавляем сотрудников, если они указаны
        if getattr(article_data, 'employee_ids', None):
            from models.employee import Employee
            for emp_id in article_data.employee_ids:
                employee = db.query(Employee).filter(Employee.id == emp_id).first()
                if employee:
                    new_article.employees.append(employee)
                    print(f"Linked employee {emp_id} to article {new_article.id}")

        db.commit()
        print("Transaction committed")

        # Обновляем объект статьи, чтобы получить свежие данные с авторами и сотрудниками
        db.refresh(new_article)
        print("Article refreshed from DB")

        # Загружаем статью с авторами и сотрудниками для корректного возврата
        from sqlalchemy.orm import selectinload, joinedload
        article_with_relations = db.query(Article).options(
            selectinload(Article.authors),
            joinedload(Article.employees)
        ).filter(Article.id == new_article.id).first()
        print(f"Returning article with {len(article_with_relations.authors)} authors and {len(article_with_relations.employees)} employees")

        return article_with_relations
    except Exception as e:
        print(f"Error in create_article: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise

@router.delete("/{id}")
def delete_article(
    id: int,
    current_user: User = Depends(get_current_admin_user),  # Только администратор может удалять статьи
    db: Session = Depends(get_db)
):
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    db.delete(article)
    db.commit()
    return {"status": "success"}