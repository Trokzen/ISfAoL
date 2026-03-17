from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db
from models.article import Article, Author, User
from api.deps import get_current_admin_user
import pandas as pd
import re
import io

router = APIRouter()

# Функция для извлечения имен авторов из строки
def extract_authors(authors_str):
    if pd.isna(authors_str) or authors_str == 'Нет авторов':
        return []

    authors = []
    # Регулярное выражение для поиска имен авторов в формате Фамилия И.О.
    pattern = r'[А-ЯЁ][а-яё]+(?:-[А-ЯЁ][а-яё]+)?\s+[А-ЯЁ]\.[А-ЯЁ]?\.?'
    matches = re.findall(pattern, authors_str)

    for match in matches:
        authors.append(match.strip())

    return authors

@router.post("/import-csv")
def import_articles_from_csv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Импорт статей из CSV файла в базу данных.
    Доступно только администраторам.
    """
    try:
        # Читаем CSV файл с разными возможными разделителями
        contents = file.file.read()
        
        # Пробуем разные варианты парсинга
        df = None
        for sep in [',', ';', '\t']:
            for quotechar in ['"', "'"]:
                try:
                    df = pd.read_csv(
                        io.BytesIO(contents), 
                        sep=sep, 
                        encoding='utf-8',
                        quotechar=quotechar,
                        skipinitialspace=True  # Пропускать пробелы после разделителя
                    )
                    if len(df.columns) >= 5:  # Минимум 5 колонок
                        break
                except:
                    continue
            if df is not None and len(df.columns) >= 5:
                break
        
        # Если ни один вариант не подошел, пробуем с другой кодировкой
        if df is None or len(df.columns) < 5:
            try:
                df = pd.read_csv(
                    io.BytesIO(contents), 
                    sep=',', 
                    encoding='windows-1251',
                    quotechar='"',
                    skipinitialspace=True
                )
            except:
                # Последний вариант - читаем как есть и пробуем разделить вручную
                contents_str = contents.decode('utf-8', errors='ignore')
                lines = contents_str.strip().split('\n')
                if len(lines) > 1:
                    # Разбираем заголовок
                    headers = lines[0].split(',')
                    # Разбираем данные (упрощенно)
                    data = []
                    for line in lines[1:]:
                        # Простая эвристика: разделяем по запятым, но не внутри кавычек
                        values = []
                        in_quotes = False
                        current = ''
                        for char in line:
                            if char == '"':
                                in_quotes = not in_quotes
                                current += char
                            elif char == ',' and not in_quotes:
                                values.append(current.strip())
                                current = ''
                            else:
                                current += char
                        values.append(current.strip())
                        data.append(values)
                    
                    df = pd.DataFrame(data, columns=headers)

        # Проверяем наличие необходимых колонок (с разными возможными названиями)
        column_mapping = {
            'ID': ['ID', 'id', 'External ID', 'external_id'],
            'Название': ['Название', 'название', 'Title', 'title', 'Наименование'],
            'Авторы': ['Авторы', 'авторы', 'Authors', 'authors', 'Список авторов'],
            'Год публикации': ['Год публикации', 'год', 'Year', 'year_pub', 'Год'],
            'В_РИНЦ': ['В_РИНЦ', 'РИНЦ', 'in_rinc', 'В РИНЦ', 'Индекс РИНЦ']
        }
        
        # Переименовываем колонки в стандартные названия
        for std_name, variants in column_mapping.items():
            for variant in variants:
                if variant in df.columns:
                    df = df.rename(columns={variant: std_name})
                    break
        
        # Проверяем наличие всех необходимых колонок
        required_columns = ['ID', 'Название', 'Авторы', 'Год публикации', 'В_РИНЦ']
        for col in required_columns:
            if col not in df.columns:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Missing required column: {col}. Available columns: {list(df.columns)}"
                )
        
        imported_count = 0
        skipped_count = 0
        
        for index, row in df.iterrows():
            try:
                # Извлекаем данные из строки
                external_id = int(row['ID']) if pd.notna(row['ID']) else None
                title = str(row['Название']) if pd.notna(row['Название']) else 'Без названия'
                authors_str = str(row['Авторы']) if pd.notna(row['Авторы']) else ''
                year_pub = int(float(row['Год публикации'])) if pd.notna(row['Год публикации']) else 2025
                in_rinc = str(row['В_РИНЦ']).strip().lower() == 'да' if pd.notna(row['В_РИНЦ']) else False
                
                # Проверяем, существует ли уже статья с таким external_id
                existing_article = db.query(Article).filter(Article.external_id == external_id).first()
                if existing_article:
                    skipped_count += 1
                    continue
                
                # Создаём новую статью
                article = Article(
                    external_id=external_id,
                    title=title,
                    year_pub=year_pub,
                    in_rinc=in_rinc
                )
                db.add(article)
                db.flush()  # Получаем ID статьи
                
                # Извлекаем авторов
                authors_list = extract_authors(authors_str)

                for author_name in authors_list:
                    # НЕ привязываем автора к пользователю автоматически
                    # Пользователь сможет привязать статью вручную через интерфейс
                    author = Author(
                        article_id=article.id,
                        author_name=author_name,
                        user_employee_id=None,  # Оставляем непривязанным
                        contribution=0.0,  # Вклад устанавливается в 0, будет указан вручную
                        applied_for_award=False
                    )
                    db.add(author)
                
                imported_count += 1
                
            except Exception as e:
                print(f"Error processing row {index}: {e}")
                skipped_count += 1
                continue
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Импортировано {imported_count} статей, пропущено {skipped_count}",
            "imported": imported_count,
            "skipped": skipped_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error importing CSV: {str(e)}")
