import re
from typing import List


def normalize_fio(fio: str) -> str:
    """
    Нормализует ФИО: удаляет лишние пробелы, приводит к нижнему регистру.
    """
    return ' '.join(fio.strip().lower().split())


def extract_fio_parts(full_name: str) -> dict:
    """
    Извлекает части ФИО из полной строки.
    Возвращает словарь с ключами: last_name, first_name, patronymic
    """
    parts = full_name.strip().split()
    
    result = {
        'last_name': parts[0] if len(parts) >= 1 else '',
        'first_name': parts[1] if len(parts) >= 2 else '',
        'patronymic': parts[2] if len(parts) >= 3 else ''
    }
    
    return result


def get_initials(name: str) -> str:
    """
    Преобразует имя в инициалы (первая буква + точка).
    Например: "Александр" -> "А."
    """
    if not name:
        return ''
    return name[0].upper() + '.'


def generate_author_variants(full_name: str) -> List[str]:
    """
    Генерирует варианты написания ФИО для поиска статей:
    - Фамилия И.О. (Иванов А.С.)
    - Фамилия И. (Иванов А.)
    - Фамилия Имя (Иванов Александр)
    - Фамилия Имя Отчество (Иванов Александр Сергеевич)
    - Фамилия (Иванов)
    
    Также генерирует варианты с разными форматами инициалов:
    - С пробелами: "А. С."
    - Без пробелов: "А.С."
    """
    variants = []
    parts = extract_fio_parts(full_name)
    
    last_name = parts['last_name']
    first_name = parts['first_name']
    patronymic = parts['patronymic']
    
    if not last_name:
        return variants
    
    # Вариант 1: Фамилия И.О. (с пробелом между инициалами)
    if first_name and patronymic:
        variants.append(f"{last_name} {get_initials(first_name)} {get_initials(patronymic)}")
    
    # Вариант 2: Фамилия И.О. (без пробела между инициалами)
    if first_name and patronymic:
        variants.append(f"{last_name} {get_initials(first_name)}{get_initials(patronymic)}")
    
    # Вариант 3: Фамилия И. (только имя)
    if first_name:
        variants.append(f"{last_name} {get_initials(first_name)}")
    
    # Вариант 4: Фамилия Имя (полное имя)
    if first_name:
        variants.append(f"{last_name} {first_name}")
    
    # Вариант 5: Фамилия Имя Отчество (полное ФИО)
    if first_name and patronymic:
        variants.append(f"{last_name} {first_name} {patronymic}")
    
    # Вариант 6: Только фамилия
    variants.append(last_name)
    
    # Вариант 7: Фамилия И. О. (с пробелами после точек)
    if first_name and patronymic:
        first_initial = get_initials(first_name).replace('.', '. ').strip()
        patronymic_initial = get_initials(patronymic).replace('.', '. ').strip()
        variants.append(f"{last_name} {first_initial} {patronymic_initial}")
    
    return variants


def match_author_with_user(author_name: str, user_full_name: str) -> bool:
    """
    Проверяет, соответствует ли имя автора в статье пользователю.
    
    author_name: имя автора как указано в статье (например, "Иванов А.С.")
    user_full_name: полное ФИО пользователя (например, "Иванов Александр Сергеевич")
    
    Возвращает True, если найдено совпадение.
    """
    # Нормализуем входные данные
    author_normalized = normalize_fio(author_name)
    user_normalized = normalize_fio(user_full_name)
    
    # Прямое совпадение
    if author_normalized == user_normalized:
        return True
    
    # Генерируем варианты для пользователя и проверяем совпадения
    user_variants = generate_author_variants(user_full_name)
    for variant in user_variants:
        if normalize_fio(variant) == author_normalized:
            return True
    
    # Проверяем совпадение по фамилии и инициалам
    user_parts = extract_fio_parts(user_full_name)
    author_parts = extract_fio_parts(author_name)
    
    # Сравниваем фамилии
    if user_parts['last_name'].lower() != author_parts['last_name'].lower():
        return False
    
    # Если в author_name только фамилия - считаем совпадением
    if not author_parts['first_name']:
        return True
    
    # Сравниваем инициалы
    user_first_initial = get_initials(user_parts['first_name'])[0].lower()
    user_patronymic_initial = get_initials(user_parts['patronymic'])[0].lower() if user_parts['patronymic'] else ''
    
    # Проверяем, соответствует ли первый инициал
    if author_parts['first_name']:
        author_first_char = author_parts['first_name'][0].lower()
        if author_first_char != user_first_initial:
            return False
    
    # Проверяем второй инициал (отчество)
    if author_parts['patronymic']:
        author_patronymic_char = author_parts['patronymic'][0].lower()
        if not user_patronymic_initial or author_patronymic_char != user_patronymic_char:
            return False
    
    return True


def find_matching_articles_for_user(user_full_name: str, articles: list) -> list:
    """
    Находит статьи, которые могут принадлежать пользователю.
    
    user_full_name: полное ФИО пользователя
    articles: список статей с авторами
    
    Возвращает список статей, где имя автора совпадает с ФИО пользователя.
    """
    matching_articles = []
    
    for article in articles:
        if hasattr(article, 'authors'):
            for author in article.authors:
                if match_author_with_user(author.author_name, user_full_name):
                    matching_articles.append(article)
                    break
    
    return matching_articles
