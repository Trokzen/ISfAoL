import requests
import json

# Тестируем создание статьи
BASE_URL = "http://127.0.0.1:8000"  # Обычно используется порт 8000 для FastAPI

def test_create_article():
    print("=== Тестирование создания статьи ===")

    # Сначала нужно получить токен аутентификации
    # Попробуем с тестовым пользователем
    login_data = {"username": "admin", "password": "admin"}  # замените на реальные учетные данные
    response = requests.post(f"{BASE_URL}/auth/token", data=login_data)

    if response.status_code != 200:
        print(f"Ошибка при аутентификации: {response.status_code}, {response.text}")
        # Попробуем другие возможные учетные данные
        login_data = {"username": "manager", "password": "manager"}
        response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
        
        if response.status_code != 200:
            print(f"Ошибка при аутентификации: {response.status_code}, {response.text}")
            # Попробуем с пользователем test
            login_data = {"username": "test", "password": "test"}
            response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
            
            if response.status_code != 200:
                print(f"Ошибка при аутентификации: {response.status_code}, {response.text}")
                return

    token_data = response.json()
    access_token = token_data['access_token']
    print(f"Токен получен: {access_token[:50]}...")

    # Подготовим данные для новой статьи
    article_data = {
        "title": "Тестовая статья",
        "year_pub": 2023,
        "in_rinc": True,
        "authors": [
            {
                "author_name": "Иванов И.И.",
                "contribution": 50.0,
                "applied_for_award": False,
                "award_applied_date": None
            }
        ],
        "employee_ids": []
    }

    # Заголовки с токеном аутентификации
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    # Отправляем POST запрос для создания статьи
    response = requests.post(
        f"{BASE_URL}/articles/",
        headers=headers,
        data=json.dumps(article_data)
    )

    print(f"Статус создания статьи: {response.status_code}")

    if response.status_code == 200:
        created_article = response.json()
        print(f"Статья успешно создана: {json.dumps(created_article, indent=2, ensure_ascii=False)}")
    elif response.status_code == 403:
        print(f"Ошибка доступа (403): возможно, у пользователя нет прав менеджера или администратора")
        print(f"Ответ сервера: {response.text}")
    elif response.status_code == 422:
        print(f"Ошибка валидации (422): неверный формат данных")
        print(f"Ответ сервера: {response.text}")
    else:
        print(f"Ошибка при создании статьи: {response.status_code}, {response.text}")

if __name__ == "__main__":
    test_create_article()