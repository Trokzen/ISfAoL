from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Float, Date
from sqlalchemy.orm import relationship
from . import Base

class Article(Base):
    __tablename__ = "articles"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    year_pub = Column(Integer, nullable=False)
    in_rinc = Column(Boolean, default=False)
    authors = relationship("Author", back_populates="article")
    # employees = relationship("Employee", secondary=employee_articles, back_populates="articles")  # <-- Удалите

class Author(Base):
    __tablename__ = "authors"
    id = Column(Integer, primary_key=True, index=True)
    article_id = Column(Integer, ForeignKey("articles.id"))
    author_name = Column(String, nullable=False)
    contribution = Column(Float, default=0.0)
    applied_for_award = Column(Boolean, default=False)
    award_applied_date = Column(Date, nullable=True)
    article = relationship("Article", back_populates="authors")