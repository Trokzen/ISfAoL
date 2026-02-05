import requests
import json

# Тестируем основные эндпоинты
BASE_URL = "http://127.0.0.1:8001"

def test_basic_endpoints():
    print("=== Тестирование основных эндпоинтов ===")
    
    # Тестируем главную страницу
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Главная страница - Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Ответ: {response.json()}")
    except Exception as e:
        print(f"Ошибка при запросе главной страницы: {e}")
    
    # Тестируем получение статей
    try:
        response = requests.get(f"{BASE_URL}/articles/")
        print(f"Получение статей - Status: {response.status_code}")
    except Exception as e:
        print(f"Ошибка при запросе статей: {e}")
    
    # Тестируем получение информации о пользователе (без токена)
    try:
        response = requests.get(f"{BASE_URL}/auth/me")
        print(f"Получение информации о пользователе (без токена) - Status: {response.status_code}")
    except Exception as e:
        print(f"Ошибка при запросе информации о пользователе: {e}")
    
    # Тестируем аутентификацию
    try:
        login_data = {"username": "test", "password": "test"}
        response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
        print(f"Аутентификация - Status: {response.status_code}")
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data['access_token']
            
            # Тестируем получение информации о пользователе с токеном
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            print(f"Получение информации о пользователе (с токеном) - Status: {response.status_code}")
            
            if response.status_code == 200:
                user_info = response.json()
                print(f"Информация о пользователе: {user_info}")
        
    except Exception as e:
        print(f"Ошибка при тестировании аутентификации: {e}")

if __name__ == "__main__":
    test_basic_endpoints()