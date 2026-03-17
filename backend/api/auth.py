from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from models.article import User, Department
from schemas.user import UserOut, UserCreate
from database import get_db
from api.deps import get_current_active_user, get_current_admin_user, get_current_manager_user
from dotenv import load_dotenv
import os

# Загружаем переменные окружения
load_dotenv()

router = APIRouter()

# Настройка безопасности
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Настройки JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def authenticate_user(db: Session, login: str, password: str):
    try:
        user = db.query(User).filter(User.login == login).first()
        if not user:
            print(f"User with login '{login}' not found")  # Для отладки
            return False
        if not verify_password(password, user.password_hash):
            print(f"Password verification failed for user '{login}'")  # Для отладки
            return False
        return user
    except Exception as e:
        print(f"Error during authentication: {e}")  # Для отладки
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/token", response_model=dict)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print("Login endpoint called with OAuth2PasswordRequestForm")
    print(f"Username received: {form_data.username}")
    print(f"Attempting to authenticate user: {form_data.username}")
    user = authenticate_user(db, form_data.username, form_data.password)
    print(f"User authentication result: {user is not None}")
    if not user:
        print(f"Authentication failed for user: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect login or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    print(f"User authenticated successfully: {user.login}, role: {user.role}")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.login, "role": user.role, "full_name": user.full_name}, expires_delta=access_token_expires
    )
    print(f"Access token created for user: {user.login}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.get("/users", response_model=list[UserOut])
def read_users(
    current_user: User = Depends(get_current_active_user),  # Требуется авторизация
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    department_id: int | None = None,
    sort_by: str = 'full_name',  # 'full_name', 'login', 'role'
    sort_order: str = 'asc',  # 'asc' или 'desc'
    db: Session = Depends(get_db)
):
    users_query = db.query(User)
    
    # Если не администратор, фильтруем по подразделениям пользователя
    if current_user.role != "admin":
        # Получаем подразделения, которыми управляет пользователь
        from models.article import Department, UserDepartment
        managed_depts = db.query(Department).filter(Department.manager_id == current_user.id).all()
        
        if managed_depts:
            dept_ids = [d.id for d in managed_depts]
            user_ids = db.query(UserDepartment.user_id).filter(
                UserDepartment.department_id.in_(dept_ids)
            ).all()
            
            if user_ids:
                user_ids = [uid[0] for uid in user_ids]
                users_query = users_query.filter(User.id.in_(user_ids))
            else:
                # Если в подразделениях нет пользователей, возвращаем пустой список
                return []
        else:
            # Если пользователь не управляет ни одним подразделением, возвращаем пустой список
            return []
    
    # Фильтр по поиску
    if search:
        users_query = users_query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.login.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )
    
    # Фильтр по подразделению (только для админа)
    if department_id and current_user.role == "admin":
        from models.article import UserDepartment
        user_ids = db.query(UserDepartment.user_id).filter(
            UserDepartment.department_id == department_id
        ).all()
        
        if user_ids:
            user_ids = [uid[0] for uid in user_ids]
            users_query = users_query.filter(User.id.in_(user_ids))
        else:
            # Если в подразделении нет пользователей, возвращаем пустой список
            return []
    
    # Сортировка
    if sort_by == 'full_name':
        if sort_order == 'desc':
            users_query = users_query.order_by(User.full_name.desc())
        else:
            users_query = users_query.order_by(User.full_name.asc())
    elif sort_by == 'login':
        if sort_order == 'desc':
            users_query = users_query.order_by(User.login.desc())
        else:
            users_query = users_query.order_by(User.login.asc())
    elif sort_by == 'role':
        if sort_order == 'desc':
            users_query = users_query.order_by(User.role.desc())
        else:
            users_query = users_query.order_by(User.role.asc())
    
    users = users_query.offset(skip).limit(limit).all()
    return users

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),  # Только администратор может удалять пользователей
    db: Session = Depends(get_db)
):
    # Проверяем, что пользователь не пытается удалить сам себя
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Находим пользователя
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Проверяем, не является ли пользователь менеджером подразделения
    from models.article import Department
    managed_depts = db.query(Department).filter(Department.manager_id == user_id).all()
    if managed_depts:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete user who is a manager of {len(managed_depts)} department(s). Remove them as manager first."
        )
    
    # Удаляем пользователя
    db.delete(user)
    db.commit()
    
    return {"status": "success", "message": f"User {user.login} deleted successfully"}

@router.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    user_data: UserCreate,
    current_user: User = Depends(get_current_admin_user),  # Только администратор может редактировать пользователей
    db: Session = Depends(get_db)
):
    # Проверяем, что пользователь не пытается изменить сам себя (только роль admin)
    if user_id == current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Cannot update yourself")
    
    # Находим пользователя
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Проверяем, не занят ли новый логин другим пользователем
    if user_data.login != user.login:
        existing_user = db.query(User).filter(User.login == user_data.login).first()
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=400, detail="User with this login already exists")
    
    # Проверяем, не занят ли новый email другим пользователем
    if user_data.email and user_data.email != user.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email and existing_email.id != user_id:
            raise HTTPException(status_code=400, detail="User with this email already exists")
    
    # Проверяем, что ФИО указано
    if not user_data.full_name:
        raise HTTPException(status_code=400, detail="Full name (ФИО) is required")
    
    # Обновляем данные пользователя
    user.login = user_data.login
    user.email = user_data.email
    user.full_name = user_data.full_name
    user.id_elibrary_user = user_data.id_elibrary_user if user_data.id_elibrary_user is not None else user_data.full_name
    
    # Если указана роль, обновляем её (только для администратора)
    if user_data.role:
        user.role = user_data.role
    
    # Если указан пароль, обновляем его
    if user_data.password:
        user.password_hash = get_password_hash(user_data.password)
    
    db.commit()
    db.refresh(user)
    
    return user

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Проверяем, существует ли уже пользователь с таким логином
    existing_user = db.query(User).filter(User.login == user.login).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this login already exists")

    # Проверяем, существует ли уже пользователь с таким email
    if user.email:
        existing_email = db.query(User).filter(User.email == user.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="User with this email already exists")

    # Создаем нового пользователя
    # Если id_elibrary_user не указано, используем full_name
    id_elibrary_value = user.id_elibrary_user if user.id_elibrary_user is not None else user.full_name
    db_user = User(
        login=user.login,
        password_hash=get_password_hash(user.password),
        email=user.email,
        role="user",  # По умолчанию роль 'user'
        full_name=user.full_name,
        id_elibrary_user=id_elibrary_value
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# Маршрут для создания менеджера подразделения (только для администраторов)
@router.post("/create-manager", response_model=UserOut)
def create_manager(
    user_data: UserCreate,
    current_user: User = Depends(get_current_admin_user),  # Только администратор может создавать менеджеров
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли уже пользователь с таким логином
    existing_user = db.query(User).filter(User.login == user_data.login).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this login already exists")

    # Проверяем, существует ли уже пользователь с таким email
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="User with this email already exists")

    # Если указан department_id, проверяем, существует ли подразделение
    department = None
    if user_data.department_id:
        department = db.query(Department).filter(Department.id == user_data.department_id).first()
        if not department:
            raise HTTPException(status_code=404, detail="Department not found")

    # Создаем менеджера подразделения
    # Если id_elibrary_user не указано, используем full_name
    id_elibrary_value = user_data.id_elibrary_user if user_data.id_elibrary_user is not None else user_data.full_name
    db_user = User(
        login=user_data.login,
        password_hash=get_password_hash(user_data.password),
        email=user_data.email,
        role="manager",  # Роль менеджера
        full_name=user_data.full_name,
        id_elibrary_user=id_elibrary_value
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Если указано подразделение, устанавливаем пользователя как менеджера подразделения
    if department:
        department.manager_id = db_user.id
        db.commit()

    return db_user

# Маршрут для создания обычного пользователя (только для менеджеров подразделений)
@router.post("/create-user", response_model=UserOut)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(get_current_manager_user),  # Только менеджер или администратор может создавать пользователей
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли уже пользователь с таким логином
    existing_user = db.query(User).filter(User.login == user_data.login).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this login already exists")

    # Проверяем, существует ли уже пользователь с таким email
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="User with this email already exists")

    # Проверяем, что ФИО указано
    if not user_data.full_name:
        raise HTTPException(status_code=400, detail="Full name (ФИО) is required")

    # Создаем обычного пользователя
    # Если id_elibrary_user не указано, используем full_name
    id_elibrary_value = user_data.id_elibrary_user if user_data.id_elibrary_user is not None else user_data.full_name
    db_user = User(
        login=user_data.login,
        password_hash=get_password_hash(user_data.password),
        email=user_data.email,
        role="user",  # Роль пользователя
        full_name=user_data.full_name,
        id_elibrary_user=id_elibrary_value
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Если текущий пользователь - менеджер, добавляем созданного пользователя в его подразделение
    if current_user.role == "manager":
        from models.article import Department, UserDepartment
        
        # Находим подразделения, которыми управляет менеджер
        managed_depts = db.query(Department).filter(Department.manager_id == current_user.id).all()
        
        if managed_depts:
            # Добавляем пользователя в первое подразделение (основное)
            dept = managed_depts[0]
            user_dept = UserDepartment(
                user_id=db_user.id,
                department_id=dept.id,
                is_primary=True
            )
            db.add(user_dept)
            db.commit()
    
    return db_user