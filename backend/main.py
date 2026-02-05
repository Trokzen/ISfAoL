from fastapi import FastAPI
from api import auth as auth_api, articles, employees, departments
from models import Base  # Только для импорта моделей
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Elibrary API")

# Добавляем CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Позволяем всем источникам для тестирования
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Welcome to Elibrary API"}

# Подключаем роутеры
app.include_router(auth_api.router, prefix="/auth", tags=["auth"])
app.include_router(articles.router, prefix="/articles", tags=["articles"])
app.include_router(employees.router, tags=["employees"])
app.include_router(departments.router, prefix="/departments", tags=["departments"])