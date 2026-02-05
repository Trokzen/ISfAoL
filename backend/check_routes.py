import requests

# Проверяем доступные маршруты
BASE_URL = "http://127.0.0.1:8001"

def check_routes():
    print("=== Checking available routes ===")
    
    # Получаем токен администратора
    login_data = {"username": "admin", "password": "admin"}
    response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
    
    if response.status_code != 200:
        print(f"Error authenticating admin: {response.status_code}")
        return
    
    token_data = response.json()
    access_token = token_data['access_token']
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Проверяем GET запрос к списку подразделений
    print("\nTesting GET /departments/ ...")
    response = requests.get(f"{BASE_URL}/departments/", headers=headers)
    print(f"GET /departments/ - Status: {response.status_code}")
    
    # Проверяем OPTIONS запрос к подразделениям
    print("\nTesting OPTIONS /departments/ ...")
    response = requests.options(f"{BASE_URL}/departments/")
    print(f"OPTIONS /departments/ - Status: {response.status_code}")
    print(f"Allow header: {response.headers.get('allow', 'Not present')}")
    
    # Проверяем, можем ли мы получить OpenAPI спецификацию
    print("\nTesting OpenAPI docs ...")
    response = requests.get(f"{BASE_URL}/openapi.json")
    print(f"OpenAPI - Status: {response.status_code}")
    
    if response.status_code == 200:
        openapi = response.json()
        paths = openapi.get('paths', {})
        dept_paths = {path: methods for path, methods in paths.items() if 'department' in path.lower() or 'department' in str(methods).lower()}
        print(f"Department-related paths: {list(dept_paths.keys())}")

if __name__ == "__main__":
    check_routes()