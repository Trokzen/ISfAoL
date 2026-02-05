import requests

# Тестируем эндпоинт получения пользователей
BASE_URL = "http://127.0.0.1:8001"

def test_users_endpoint():
    print("=== Testing users endpoint ===")
    
    # Сначала получаем токен администратора
    login_data = {"username": "admin", "password": "admin"}
    response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
    
    if response.status_code != 200:
        print(f"Error authenticating admin: {response.status_code}, {response.text}")
        return
    
    token_data = response.json()
    access_token = token_data['access_token']
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print("OK Admin authentication successful")
    
    # Тестируем эндпоинт получения пользователей
    print("\nTesting GET /auth/users ...")
    response = requests.get(f"{BASE_URL}/auth/users", headers=headers)
    print(f"GET /auth/users - Status: {response.status_code}")
    
    if response.status_code == 200:
        users = response.json()
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"  - ID: {user['id']}, Login: {user['login']}, Role: {user['role']}")
    else:
        print(f"Error getting users: {response.text}")
    
    # Тестируем, что обычный пользователь не может получить список пользователей
    print(f"\nTesting protection - regular user should not have access...")
    
    # Получаем токен обычного пользователя
    user_login_data = {"username": "test", "password": "test"}
    user_response = requests.post(f"{BASE_URL}/auth/token", data=user_login_data)
    
    if user_response.status_code == 200:
        user_token_data = user_response.json()
        user_access_token = user_token_data['access_token']
        user_headers = {"Authorization": f"Bearer {user_access_token}"}
        
        # Пробуем получить список пользователей от имени обычного пользователя
        response = requests.get(f"{BASE_URL}/auth/users", headers=user_headers)
        print(f"GET /auth/users by regular user - Status: {response.status_code}")
        
        if response.status_code == 403:  # Forbidden
            print("OK Protection works - regular user cannot access users list")
        else:
            print(f"Warning Expected status 403, got {response.status_code}")

if __name__ == "__main__":
    test_users_endpoint()