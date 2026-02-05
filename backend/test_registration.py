import requests
import json

# Тестируем регистрацию нового пользователя
BASE_URL = "http://127.0.0.1:8001"

def test_registration():
    # Пробуем зарегистрировать нового пользователя
    user_data = {
        "login": "test_user",
        "email": "test@example.com",
        "password": "testpassword123",
        "full_name": "Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=user_data)
        print(f"Registration Status Code: {response.status_code}")
        print(f"Registration Response: {response.text}")
        
        if response.status_code == 200:
            print("Registration successful!")
            
            # Пробуем залогиниться новым пользователем
            login_data = {
                "username": "test_user",
                "password": "testpassword123"
            }
            
            login_response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
            print(f"Login Status Code: {login_response.status_code}")
            print(f"Login Response: {login_response.text}")
            
            if login_response.status_code == 200:
                print("Login with new user successful!")
            else:
                print("Login with new user failed!")
        else:
            print("Registration failed!")
            
    except Exception as e:
        print(f"Error during registration: {e}")

if __name__ == "__main__":
    test_registration()