from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session, selectinload, joinedload
from database import get_db
from models.article import Article, Author, User, EmployeeArticle, Department
from models.article import User as UserAlias  # Избегаем конфликта имен
from schemas.article import ArticleOut, AuthorUpdate, AuthorCreate, ArticleCreate
from api.deps import get_current_active_user, get_current_admin_user, get_current_manager_user, check_user_can_edit_article
from utils.fio_utils import generate_author_variants, match_author_with_user
from typing import List, Optional
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

@router.get("/", response_model=PaginatedArticlesResponse)
def get_articles(
    page: int = 1,
    per_page: int = 50,
    search_id: Optional[int] = None,
    search_external_id: Optional[int] = None,  # Новый параметр для поиска по external_id
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
    if search_external_id:
        query = query.filter(Article.external_id == search_external_id)
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

@router.post("/", response_model=ArticleOut)
def create_article(
    article_data: ArticleCreate,
    current_user: User = Depends(get_current_manager_user),  # Менеджер или администратор может создавать статьи
    db: Session = Depends(get_db)
):
    # Проверяем, занят ли указанный external_id, если он предоставлен
    if article_data.external_id is not None:
        existing_article = db.query(Article).filter(Article.external_id == article_data.external_id).first()
        if existing_article:
            raise HTTPException(
                status_code=400,
                detail=f"Article with external ID {article_data.external_id} already exists"
            )
    
    # Создаем новую статью
    new_article = Article(
        external_id=article_data.external_id,
        title=article_data.title,
        year_pub=article_data.year_pub,
        in_rinc=article_data.in_rinc
    )
    db.add(new_article)
    db.flush()  # Чтобы получить ID статьи

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
            user_employee_id=author_data.user_employee_id,
            contribution=author_data.contribution,
            applied_for_award=author_data.applied_for_award,
            award_applied_date=award_date
        )
        db.add(new_author)

    # Добавляем сотрудников, если они указаны
    if article_data.employee_ids:
        for emp_id in article_data.employee_ids:
            # Создаем связь между сотрудником и статьей
            emp_article = EmployeeArticle(
                employee_id=emp_id,
                article_id=new_article.id
            )
            db.add(emp_article)

    db.commit()

    # Обновляем объект статьи, чтобы получить свежие данные с авторами и сотрудниками
    db.refresh(new_article)

    # Загружаем статью с авторами и сотрудниками для корректного возврата
    article_with_relations = db.query(Article).options(
        selectinload(Article.authors),
        joinedload(Article.employees)
    ).filter(Article.id == new_article.id).first()

    return article_with_relations

@router.put("/{id}", response_model=ArticleOut)
def update_article(
    id: int,
    article_update: ArticleCreate,  # Используем ту же схему для обновления
    current_user: User = Depends(get_current_manager_user),  # Менеджер или администратор может редактировать статьи
    db: Session = Depends(get_db)
):
    # Находим существующую статью
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Проверяем права на редактирование
    check_user_can_edit_article(current_user, id, db)

    # Проверяем, занят ли новый external_id, если он изменяется
    if article_update.external_id is not None and article_update.external_id != article.external_id:
        existing_article = db.query(Article).filter(Article.external_id == article_update.external_id).first()
        if existing_article and existing_article.id != id:
            raise HTTPException(
                status_code=400,
                detail=f"Article with external ID {article_update.external_id} already exists"
            )
    
    # Обновляем поля статьи
    article.external_id = article_update.external_id
    article.title = article_update.title
    article.year_pub = article_update.year_pub
    article.in_rinc = article_update.in_rinc

    # Удаляем существующих авторов
    db.query(Author).filter(Author.article_id == article.id).delete()
    
    # Добавляем новых авторов
    for author_data in article_update.authors:
        award_date = None
        if author_data.award_applied_date:
            from datetime import datetime
            try:
                if isinstance(author_data.award_applied_date, str):
                    award_date = datetime.strptime(author_data.award_applied_date, '%Y-%m-%d').date()
                else:
                    award_date = author_data.award_applied_date
            except (ValueError, TypeError):
                award_date = None

        new_author = Author(
            article_id=article.id,
            author_name=author_data.author_name,
            user_employee_id=author_data.user_employee_id,
            contribution=author_data.contribution,
            applied_for_award=author_data.applied_for_award,
            award_applied_date=award_date
        )
        db.add(new_author)

    # Обновляем связи со сотрудниками
    # Удаляем существующие связи
    db.query(EmployeeArticle).filter(EmployeeArticle.article_id == article.id).delete()
    
    # Добавляем новые связи
    for emp_id in article_update.employee_ids:
        emp_article = EmployeeArticle(
            employee_id=emp_id,
            article_id=article.id
        )
        db.add(emp_article)

    db.commit()
    db.refresh(article)

    # Возвращаем обновленную статью с авторами и сотрудниками
    from sqlalchemy.orm import selectinload, joinedload
    updated_article = db.query(Article).options(
        selectinload(Article.authors),
        joinedload(Article.employees)
    ).filter(Article.id == article.id).first()

    return updated_article

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


# Эндпоинты для привязки статей к пользователям
class ArticleClaimResponse(BaseModel):
    article_id: int
    author_id: int
    user_id: int
    message: str
    article_title: str
    author_name: str

@router.get("/my/suggestions", response_model=List[ArticleOut])
def get_article_suggestions_for_user(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Возвращает список статей, которые могут принадлежать пользователю.
    Поиск осуществляется по совпадению ФИО пользователя с именами авторов в статьях.
    """
    # Получаем все статьи с авторами
    articles = db.query(Article).options(
        joinedload(Article.authors)
    ).all()
    
    # Генерируем варианты ФИО для пользователя
    user_variants = generate_author_variants(current_user.full_name)
    
    # Находим статьи, где автор совпадает с пользователем
    matching_articles = []
    for article in articles:
        for author in article.authors:
            # Проверяем, совпадает ли автор с пользователем
            if match_author_with_user(author.author_name, current_user.full_name):
                # Проверяем, не привязана ли статья уже к другому пользователю
                if author.user_employee_id is None or author.user_employee_id == current_user.id:
                    matching_articles.append(article)
                    break
    
    return matching_articles


@router.post("/{article_id}/claim", response_model=ArticleClaimResponse)
def claim_article(
    article_id: int,
    author_data: dict = Body(...),  # Получаем данные из JSON body
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Привязывает статью к пользователю.
    Создаёт или обновляет запись автора, связывая её с пользователем.
    """
    author_name = author_data.get("author_name")
    
    if not author_name:
        raise HTTPException(status_code=400, detail="author_name is required")
    
    # Находим статью
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Находим автора в статье
    author = db.query(Author).filter(
        Author.article_id == article_id,
        Author.author_name == author_name
    ).first()

    if not author:
        raise HTTPException(
            status_code=404,
            detail=f"Author '{author_name}' not found in this article"
        )

    # Проверяем, не привязан ли автор уже к другому пользователю
    if author.user_employee_id is not None and author.user_employee_id != current_user.id:
        raise HTTPException(
            status_code=400,
            detail="This author is already linked to another user"
        )

    # Привязываем автора к пользователю
    author.user_employee_id = current_user.id
    db.commit()
    db.refresh(author)

    return {
        "article_id": article_id,
        "author_id": author.id,
        "user_id": current_user.id,
        "message": "Article successfully claimed",
        "article_title": article.title,
        "author_name": author.author_name
    }


@router.get("/my/articles", response_model=List[ArticleOut])
def get_my_articles(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Возвращает список статей, привязанных к пользователю.
    """
    # Находим все статьи, где пользователь указан как автор
    articles = db.query(Article).join(Author).filter(
        Author.user_employee_id == current_user.id
    ).options(
        joinedload(Article.authors)
    ).all()

    return articles


# Эндпоинты для управления статьями пользователей (администратор и менеджер)
class UserArticleClaimResponse(BaseModel):
    article_id: int
    author_id: int
    user_id: int
    message: str
    article_title: str
    author_name: str

class UserOut(BaseModel):
    id: int
    login: str
    full_name: str
    email: Optional[str] = None
    role: str
    
    class Config:
        from_attributes = True

@router.get("/management/users", response_model=List[UserOut])
def get_users_for_management(
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Возвращает список пользователей для управления статьями.
    Администратор видит всех пользователей.
    Менеджер видит только пользователей своего подразделения.
    """
    query = db.query(User)
    
    # Если не администратор, фильтруем по подразделениям менеджера
    if current_user.role != "admin":
        # Получаем подразделения, которыми управляет текущий пользователь
        managed_depts = db.query(Department).filter(Department.manager_id == current_user.id).all()
        
        if not managed_depts:
            return []  # Менеджер не управляет ни одним подразделением
        
        dept_ids = [d.id for d in managed_depts]
        
        # Получаем пользователей в этих подразделениях
        from models.article import UserDepartment
        user_ids = db.query(UserDepartment.user_id).filter(
            UserDepartment.department_id.in_(dept_ids)
        ).all()
        
        if not user_ids:
            return []
        
        user_ids = [uid[0] for uid in user_ids]
        query = query.filter(User.id.in_(user_ids))
    
    # Фильтр по поиску (только по ФИО)
    if search:
        query = query.filter(User.full_name.ilike(f"%{search}%"))
    
    # Фильтр по подразделению (для админа)
    if department_id and current_user.role == "admin":
        from models.article import UserDepartment
        user_ids = db.query(UserDepartment.user_id).filter(
            UserDepartment.department_id == department_id
        ).all()
        
        if user_ids:
            user_ids = [uid[0] for uid in user_ids]
            query = query.filter(User.id.in_(user_ids))
        else:
            return []
    
    return query.limit(100).all()


@router.get("/management/users/{user_id}/suggestions", response_model=List[ArticleOut])
def get_article_suggestions_for_user(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Возвращает список статей, которые могут принадлежать указанному пользователю.
    Доступно администраторам и менеджерам подразделений (для своих пользователей).
    """
    # Проверяем права доступа
    if current_user.role != "admin":
        # Проверяем, есть ли у менеджера доступ к этому пользователю
        from models.article import UserDepartment
        managed_depts = db.query(Department).filter(Department.manager_id == current_user.id).all()
        
        if managed_depts:
            dept_ids = [d.id for d in managed_depts]
            is_accessible = db.query(UserDepartment).filter(
                UserDepartment.user_id == user_id,
                UserDepartment.department_id.in_(dept_ids)
            ).first()
            
            if not is_accessible:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: This user is not in your department"
                )
        else:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You don't manage any departments"
            )
    
    # Находим пользователя
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Получаем все статьи с авторами
    articles = db.query(Article).options(
        joinedload(Article.authors)
    ).all()
    
    # Находим статьи, где автор совпадает с пользователем
    matching_articles = []
    for article in articles:
        for author in article.authors:
            if match_author_with_user(author.author_name, target_user.full_name):
                matching_articles.append(article)
                break
    
    return matching_articles


@router.get("/management/users/{user_id}/articles", response_model=List[ArticleOut])
def get_user_articles(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Возвращает список статей, привязанных к указанному пользователю.
    Доступно администраторам и менеджерам подразделений (для своих пользователей).
    """
    # Проверяем права доступа (аналогично эндпоинту выше)
    if current_user.role != "admin":
        from models.article import UserDepartment
        managed_depts = db.query(Department).filter(Department.manager_id == current_user.id).all()
        
        if managed_depts:
            dept_ids = [d.id for d in managed_depts]
            is_accessible = db.query(UserDepartment).filter(
                UserDepartment.user_id == user_id,
                UserDepartment.department_id.in_(dept_ids)
            ).first()
            
            if not is_accessible:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: This user is not in your department"
                )
        else:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You don't manage any departments"
            )
    
    # Находим статьи, привязанные к пользователю
    articles = db.query(Article).join(Author).filter(
        Author.user_employee_id == user_id
    ).options(
        joinedload(Article.authors)
    ).all()
    
    return articles


@router.post("/articles/{article_id}/claim-for-user", response_model=UserArticleClaimResponse)
def claim_article_for_user(
    article_id: int,
    author_name: Optional[str] = None,
    user_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Привязывает статью к указанному пользователю.
    Доступно администраторам и менеджерам подразделений (для своих пользователей).
    """
    if not author_name or user_id is None:
        raise HTTPException(status_code=400, detail="author_name and user_id are required")
    
    # Проверяем права доступа (аналогично эндпоинту выше)
    if current_user.role != "admin":
        from models.article import UserDepartment
        managed_depts = db.query(Department).filter(Department.manager_id == current_user.id).all()
        
        if managed_depts:
            dept_ids = [d.id for d in managed_depts]
            is_accessible = db.query(UserDepartment).filter(
                UserDepartment.user_id == user_id,
                UserDepartment.department_id.in_(dept_ids)
            ).first()
            
            if not is_accessible:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: This user is not in your department"
                )
        else:
            raise HTTPException(
                status_code=403,
                detail="Access denied: You don't manage any departments"
            )
    
    # Находим статью
    article = db.query(Article).filter(Article.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Находим автора в статье
    author = db.query(Author).filter(
        Author.article_id == article_id,
        Author.author_name == author_name
    ).first()
    
    if not author:
        raise HTTPException(
            status_code=404,
            detail=f"Author '{author_name}' not found in this article"
        )
    
    # Проверяем, не привязан ли автор уже к другому пользователю
    if author.user_employee_id is not None and author.user_employee_id != user_id:
        raise HTTPException(
            status_code=400,
            detail="This author is already linked to another user"
        )
    
    # Привязываем автора к пользователю
    author.user_employee_id = user_id
    db.commit()
    db.refresh(author)
    
    return {
        "article_id": article_id,
        "author_id": author.id,
        "user_id": user_id,
        "message": "Article successfully claimed for user",
        "article_title": article.title,
        "author_name": author.author_name
    }


@router.post("/articles/{article_id}/unclaim")
def unclaim_article(
    article_id: int,
    author_id: Optional[int] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Отвязывает статью от пользователя.
    Доступно администраторам и менеджерам подразделений.
    """
    if author_id is None:
        raise HTTPException(status_code=400, detail="author_id is required")
    
    # Находим автора
    author = db.query(Author).filter(
        Author.id == author_id,
        Author.article_id == article_id
    ).first()
    
    if not author:
        raise HTTPException(status_code=404, detail="Author not found in this article")
    
    # Проверяем права доступа
    if current_user.role != "admin":
        # Для менеджера проверяем, принадлежит ли пользователь к его подразделению
        if author.user_employee_id:
            from models.article import UserDepartment
            managed_depts = db.query(Department).filter(Department.manager_id == current_user.id).all()
            
            if managed_depts:
                dept_ids = [d.id for d in managed_depts]
                is_accessible = db.query(UserDepartment).filter(
                    UserDepartment.user_id == author.user_employee_id,
                    UserDepartment.department_id.in_(dept_ids)
                ).first()
                
                if not is_accessible:
                    raise HTTPException(
                        status_code=403,
                        detail="Access denied: This user is not in your department"
                    )
            else:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied: You don't manage any departments"
                )
    
    # Отвязываем автора
    author.user_employee_id = None
    db.commit()
    
    return {"status": "success", "message": "Article unclaimed successfully"}