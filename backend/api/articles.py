from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.article import Article
from schemas.article import ArticleOut, AuthorUpdate
from api.deps import get_current_active_user

router = APIRouter()

# Сначала — маршрут для списка
@router.get("/", response_model=list[ArticleOut])
def get_articles(
    skip: int = 0,
    limit: int = 100,
    search_id: int = None,
    search_title: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Article)
    if search_id:
        query = query.filter(Article.id == search_id)
    if search_title:
        query = query.filter(Article.title.ilike(f"%{search_title}%"))
    articles = query.offset(skip).limit(limit).all()
    return articles

# Потом — маршрут для одной статьи
@router.get("/{id}", response_model=ArticleOut)
def get_article(id: int, db: Session = Depends(get_db)):
    article = db.query(Article).filter(Article.id == id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article

@router.put("/authors/bulk-update")
def update_authors_bulk(updates: list[AuthorUpdate], db: Session = Depends(get_db)):
    from models.article import Author
    for update in updates:
        author = db.query(Author).filter(Author.id == update.id).first()
        if author:
            author.contribution = update.contribution
            author.applied_for_award = update.applied_for_award
            author.award_applied_date = update.award_applied_date
    db.commit()
    return {"status": "success"}