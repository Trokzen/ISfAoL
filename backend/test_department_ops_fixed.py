import requests
import json

# Тестируем операции с подразделениями
BASE_URL = "http://127.0.0.1:8001"

def test_department_operations():
    print("=== Testing department operations ===")
    
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
    
    # 1. Создание нового подразделения
    print("\n1. Creating new department...")
    new_dept_data = {
        "name": "Test Department",
        "manager_id": 5  # ID администратора
    }
    
    response = requests.post(f"{BASE_URL}/departments/", json=new_dept_data, headers=headers)
    print(f"   Create department - Status: {response.status_code}")
    
    if response.status_code == 200:
        dept_info = response.json()
        dept_id = dept_info['id']
        print(f"   Department created with ID: {dept_id}")
        print(f"   Info: {dept_info}")
    else:
        print(f"   Error creating department: {response.text}")
        return  # Прерываем тест, если не можем создать подразделение
    
    # 2. Получение списка подразделений
    print("\n2. Getting departments list...")
    response = requests.get(f"{BASE_URL}/departments/", headers=headers)
    print(f"   Get list - Status: {response.status_code}")
    
    if response.status_code == 200:
        depts_list = response.json()
        print(f"   Found departments: {len(depts_list)}")
    else:
        print(f"   Error getting list: {response.text}")
    
    # 3. Получение конкретного подразделения
    print(f"\n3. Getting department info ID {dept_id}...")
    response = requests.get(f"{BASE_URL}/departments/{dept_id}", headers=headers)
    print(f"   Get info - Status: {response.status_code}")
    
    if response.status_code == 200:
        dept_info = response.json()
        print(f"   Department info: {dept_info}")
    else:
        print(f"   Error getting info: {response.text}")
    
    # 4. Обновление подразделения
    print(f"\n4. Updating department ID {dept_id}...")
    update_data = {
        "name": "Updated Test Department",
        "manager_id": 5
    }
    
    response = requests.put(f"{BASE_URL}/departments/{dept_id}", json=update_data, headers=headers)
    print(f"   Update department - Status: {response.status_code}")
    
    if response.status_code == 200:
        updated_dept = response.json()
        print(f"   Department updated: {updated_dept}")
    else:
        print(f"   Error updating: {response.text}")
    
    # 5. Проверка, что обычный пользователь не может создавать подразделения
    print(f"\n5. Checking protection - regular user should not have access...")
    
    # Получаем токен обычного пользователя
    user_login_data = {"username": "test", "password": "test"}
    user_response = requests.post(f"{BASE_URL}/auth/token", data=user_login_data)
    
    if user_response.status_code == 200:
        user_token_data = user_response.json()
        user_access_token = user_token_data['access_token']
        user_headers = {"Authorization": f"Bearer {user_access_token}"}
        
        # Пробуем создать подразделение от имени обычного пользователя
        response = requests.post(f"{BASE_URL}/departments/", json=new_dept_data, headers=user_headers)
        print(f"   Create department by regular user - Status: {response.status_code}")
        
        if response.status_code == 403:  # Forbidden
            print("   OK Protection works - regular user cannot create departments")
        else:
            print(f"   Warning Expected status 403, got {response.status_code}")
    
    # 6. Удаление подразделения
    print(f"\n6. Deleting department ID {dept_id}...")
    response = requests.delete(f"{BASE_URL}/departments/{dept_id}", headers=headers)
    print(f"   Delete department - Status: {response.status_code}")
    
    if response.status_code == 200:
        print("   Department successfully deleted")
    else:
        print(f"   Error deleting: {response.text}")

if __name__ == "__main__":
    test_department_operations()