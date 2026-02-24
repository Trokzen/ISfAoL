from database import get_db
from models.article import Article, Author

db_gen = get_db()
db = next(db_gen)

try:
    # Создаём тестовые статьи
    articles_data = [
        {
            "title": "Исследование методов машинного обучения",
            "year_pub": 2024,
            "in_rinc": True,
            "authors": ["Яровой Р.В.", "Иванов А.С.", "Петров Б.Г."]
        },
        {
            "title": "Анализ данных в научных исследованиях",
            "year_pub": 2023,
            "in_rinc": False,
            "authors": ["Яровой Р.В.", "Сидоров В.Д."]
        },
        {
            "title": "Современные подходы к разработке ПО",
            "year_pub": 2025,
            "in_rinc": True,
            "authors": ["Константинов С.А.", "Яровой Р."]
        },
        {
            "title": "Базы данных нового поколения",
            "year_pub": 2024,
            "in_rinc": False,
            "authors": ["Смирнов А.А.", "Кузнецов Б.Б."]
        },
    ]
    
    for article_data in articles_data:
        # Создаём статью
        article = Article(
            title=article_data["title"],
            year_pub=article_data["year_pub"],
            in_rinc=article_data["in_rinc"]
        )
        db.add(article)
        db.flush()  # Получаем ID статьи
        
        # Добавляем авторов
        for author_name in article_data["authors"]:
            author = Author(
                article_id=article.id,
                author_name=author_name,
                user_employee_id=None,  # Пока не привязан к пользователю
                contribution=50.0,
                applied_for_award=False
            )
            db.add(author)
        
        print(f"Создана статья: {article_data['title']}")
    
    db.commit()
    print("\nВсе статьи успешно созданы!")
    
finally:
    db.close()
