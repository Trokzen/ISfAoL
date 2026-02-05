import requests
import json

# Тестируем полный цикл аутентификации
BASE_URL = "http://127.0.0.1:8001"

def test_full_auth_cycle():
    print("=== Тестирование полного цикла аутентификации ===")
    
    # 1. Попробуем зарегистрировать нового пользователя
    print("\n1. Регистрация нового пользователя...")
    user_data = {
        "login": "test_auth_cycle",
        "email": "test_auth_cycle@example.com",
        "password": "securepassword123",
        "full_name": "Test Auth Cycle"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"   Регистрация - Статус: {response.status_code}")
        if response.status_code == 200:
            print("   Регистрация успешна!")
            user_info = response.json()
            print(f"   ID пользователя: {user_info['id']}")
        else:
            print(f"   Ошибка регистрации: {response.text}")
            return
    except Exception as e:
        print(f"   Ошибка при регистрации: {e}")
        return
    
    # 2. Попробуем залогиниться этим пользователем
    print("\n2. Вход в систему...")
    login_data = {
        "username": "test_auth_cycle",
        "password": "securepassword123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
        print(f"   Вход - Статус: {response.status_code}")
        if response.status_code == 200:
            print("   Вход успешен!")
            token_data = response.json()
            access_token = token_data['access_token']
            print(f"   Тип токена: {token_data['token_type']}")
        else:
            print(f"   Ошибка входа: {response.text}")
            return
    except Exception as e:
        print(f"   Ошибка при входе: {e}")
        return
    
    # 3. Попробуем получить информацию о пользователе с помощью токена
    print("\n3. Получение информации о пользователе...")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print(f"   Получение информации - Статус: {response.status_code}")
        if response.status_code == 200:
            print("   Получение информации успешно!")
            user_info = response.json()
            print(f"   Логин: {user_info['login']}")
            print(f"   Роль: {user_info['role']}")
            print(f"   Email: {user_info['email']}")
        else:
            print(f"   Ошибка получения информации: {response.text}")
    except Exception as e:
        print(f"   Ошибка при получении информации: {e}")
    
    print("\n=== Тестирование завершено ===")

if __name__ == "__main__":
    test_full_auth_cycle()