import requests
import json

# Тестируем аутентификацию с различными пользователями
BASE_URL = "http://127.0.0.1:8001"

def test_login_users():
    # Пробуем залогиниться с разными пользователями
    users_to_test = [
        {"username": "test", "password": "test"},
        {"username": "admin", "password": "admin"},  # если пароль админа тоже "admin"
        {"username": "manager", "password": "manager"}  # если пароль менеджера тоже "manager"
    ]
    
    for user_data in users_to_test:
        print(f"\nТестируем пользователя: {user_data['username']}")
        login_data = {
            "username": user_data["username"],
            "password": user_data["password"]
        }
        
        try:
            response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code == 200:
                token_data = response.json()
                print(f"  Login successful!")
                
                # Пробуем получить информацию о пользователе
                headers = {"Authorization": f"Bearer {token_data['access_token']}"}
                user_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
                print(f"  User Info Status: {user_response.status_code}")
                if user_response.status_code == 200:
                    user_info = user_response.json()
                    print(f"  User Role: {user_info.get('role', 'Unknown')}")
            else:
                print(f"  Login failed: {response.text}")
                
        except Exception as e:
            print(f"  Error during login: {e}")

if __name__ == "__main__":
    test_login_users()