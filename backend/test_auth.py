import requests
import json

# Тестируем аутентификацию
BASE_URL = "http://127.0.0.1:8001"

def test_login():
    # Пробуем залогиниться с тестовым пользователем
    login_data = {
        "username": "test",  # используем одного из существующих пользователей
        "password": "test"  # используем правильный пароль
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            token_data = response.json()
            print(f"Access Token: {token_data.get('access_token', 'Not found')}")
            print("Login successful!")
            
            # Пробуем получить информацию о пользователе
            headers = {"Authorization": f"Bearer {token_data['access_token']}"}
            user_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
            print(f"User Info Status: {user_response.status_code}")
            print(f"User Info: {user_response.text}")
        else:
            print("Login failed!")
            
    except Exception as e:
        print(f"Error during login: {e}")

if __name__ == "__main__":
    test_login()