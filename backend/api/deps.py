from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import timedelta
from database import get_db
from models.user import User
from dotenv import load_dotenv
import os

# Загружаем переменные окружения
load_dotenv()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    print(f"get_current_user called with token")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        login: str = payload.get("sub")
        if login is None:
            raise credentials_exception
    except JWTError:
        print(f"JWT Error occurred")
        raise credentials_exception
    print(f"Looking for user with login: {login}")
    user = db.query(User).filter(User.login == login).first()
    print(f"Found user in DB: {user is not None}")
    if user is None:
        print(f"User not found in DB")
        raise credentials_exception
    print(f"Returning user: {user.login}")
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)):
    print(f"get_current_active_user called for user: {current_user.login}")
    return current_user

def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

def get_current_manager_user(current_user: User = Depends(get_current_active_user)):
    if current_user.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Manager privileges required"
        )
    return current_user

def check_user_can_edit_article(user: User, article_id: int, db: Session):
    """
    Проверяет, может ли пользователь редактировать статью
    - Администратор может редактировать любую статью
    - Менеджер может редактировать статьи, связанные с его подразделением
    - Пользователь может редактировать только свой вклад в статью
    """
    from models.article import Article, Author

    if user.role == "admin":
        return True

    if user.role == "manager":
        # Менеджер может редактировать статьи, в которых есть авторы из его подразделения
        # В текущей реализации используем информацию из ФИО пользователя для определения подразделения
        # или связываем с сотрудниками через ФИО
        from models.employee import Employee

        if user.full_name:
            # Проверяем, есть ли авторы в статье, которые принадлежат к тому же подразделению
            # что и пользователь (через информацию в ФИО)
            article_authors = db.query(Author).join(Article).filter(
                Article.id == article_id,
                Author.author_name.contains(user.full_name.split()[0])  # Проверяем по фамилии
            ).count()

            if article_authors > 0:
                return True
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to edit this article"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Manager must have a full name to edit articles"
            )

    if user.role == "user":
        # Пользователь может редактировать статьи, в которых он является автором
        if user.full_name:
            article_authors = db.query(Author).join(Article).filter(
                Article.id == article_id,
                Author.author_name.contains(user.full_name.split()[0])  # Проверяем по фамилии
            ).count()

            if article_authors > 0:
                return True
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You don't have permission to edit this article"
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to edit this article"
            )

    # Если роль неизвестна, запрещаем доступ
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Insufficient permissions"
    )