import requests
import json

# Тестируем эндпоинт получения информации о пользователе
BASE_URL = "http://127.0.0.1:8001"

def test_user_info_endpoint():
    print("=== Тестирование эндпоинта получения информации о пользователе ===")
    
    # Сначала получаем токен
    login_data = {"username": "test", "password": "test"}
    response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
    
    if response.status_code != 200:
        print(f"Ошибка при аутентификации: {response.status_code}, {response.text}")
        return
    
    token_data = response.json()
    access_token = token_data['access_token']
    print(f"Токен получен: {access_token[:50]}...")
    
    # Затем запрашиваем информацию о пользователе
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    print(f"Статус получения информации о пользователе: {response.status_code}")
    
    if response.status_code == 200:
        user_info = response.json()
        print(f"Информация о пользователе: {json.dumps(user_info, indent=2, ensure_ascii=False)}")
        
        # Проверяем наличие обязательных полей
        required_fields = ['id', 'login', 'role', 'email', 'full_name']
        missing_fields = [field for field in required_fields if field not in user_info]
        
        if missing_fields:
            print(f"⚠️  Отсутствуют обязательные поля: {missing_fields}")
        else:
            print("✓ Все обязательные поля присутствуют")
            
        # Проверяем типы данных
        print(f"Типы данных:")
        for field, value in user_info.items():
            print(f"  {field}: {type(value).__name__} = {repr(value)}")
    else:
        print(f"Ошибка при получении информации о пользователе: {response.status_code}, {response.text}")

def test_articles_endpoint():
    print("\n=== Тестирование эндпоинта получения статей ===")
    
    # Пробуем получить статьи без токена (должно работать)
    response = requests.get(f"{BASE_URL}/articles/")
    
    print(f"Статус получения статей: {response.status_code}")
    
    if response.status_code == 200:
        articles_data = response.json()
        print(f"Получено статей: {len(articles_data.get('articles', []))}")
        
        # Проверяем структуру первой статьи, если она есть
        if articles_data.get('articles'):
            first_article = articles_data['articles'][0]
            print(f"Структура первой статьи: {list(first_article.keys())}")
            
            # Проверяем, есть ли поле employees в статье
            if 'employees' in first_article:
                print(f"  Поле employees присутствует, содержит {len(first_article['employees'])} сотрудников")
            else:
                print(f"  Поле employees отсутствует")
    else:
        print(f"Ошибка при получении статей: {response.status_code}, {response.text}")

if __name__ == "__main__":
    test_user_info_endpoint()
    test_articles_endpoint()