from fastapi import FastAPI
from api import auth, articles, employees, departments
from models import Base  # Только для импорта моделей

app = FastAPI(title="Elibrary API")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(articles.router, tags=["articles"])
app.include_router(employees.router, tags=["employees"])
app.include_router(departments.router, tags=["departments"])

@app.get("/")
def root():
    return {"message": "Welcome to Elibrary API"}