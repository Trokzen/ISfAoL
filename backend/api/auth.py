from datetime import datetime, timedelta
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from models.user import User
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
        data={"sub": user.login, "role": user.role}, expires_delta=access_token_expires
    )
    print(f"Access token created for user: {user.login}")
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.get("/users", response_model=list[UserOut])
def read_users(
    current_user: User = Depends(get_current_admin_user),  # Только администратор может просматривать всех пользователей
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return users

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
    db_user = User(
        login=user.login,
        password_hash=get_password_hash(user.password),
        email=user.email,
        role="user",  # По умолчанию роль 'user'
        full_name=user.full_name
        # Поле department больше не используется
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

    # Создаем менеджера подразделения
    db_user = User(
        login=user_data.login,
        password_hash=get_password_hash(user_data.password),
        email=user_data.email,
        role="manager",  # Роль менеджера
        full_name=user_data.full_name,
        department=user_data.department
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
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

    # Создаем обычного пользователя
    db_user = User(
        login=user_data.login,
        password_hash=get_password_hash(user_data.password),
        email=user_data.email,
        role="user",  # Роль пользователя
        full_name=user_data.full_name,
        department=user_data.department
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user