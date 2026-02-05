import requests
import json

# Тестируем операции с подразделениями
BASE_URL = "http://127.0.0.1:8001"

def test_department_operations():
    print("=== Тестирование операций с подразделениями ===")
    
    # Сначала получаем токен администратора
    login_data = {"username": "admin", "password": "admin"}
    response = requests.post(f"{BASE_URL}/auth/token", data=login_data)
    
    if response.status_code != 200:
        print(f"Ошибка при аутентификации администратора: {response.status_code}, {response.text}")
        return
    
    token_data = response.json()
    access_token = token_data['access_token']
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print("✓ Аутентификация администратора успешна")
    
    # 1. Создание нового подразделения
    print("\n1. Создание нового подразделения...")
    new_dept_data = {
        "name": "Тестовое подразделение",
        "manager_id": 5  # ID администратора
    }
    
    response = requests.post(f"{BASE_URL}/departments/", json=new_dept_data, headers=headers)
    print(f"   Создание подразделения - Status: {response.status_code}")
    
    if response.status_code == 200:
        dept_info = response.json()
        dept_id = dept_info['id']
        print(f"   Подразделение создано с ID: {dept_id}")
        print(f"   Информация: {dept_info}")
    else:
        print(f"   Ошибка создания подразделения: {response.text}")
        return  # Прерываем тест, если не можем создать подразделение
    
    # 2. Получение списка подразделений
    print("\n2. Получение списка подразделений...")
    response = requests.get(f"{BASE_URL}/departments/", headers=headers)
    print(f"   Получение списка - Status: {response.status_code}")
    
    if response.status_code == 200:
        depts_list = response.json()
        print(f"   Найдено подразделений: {len(depts_list)}")
    else:
        print(f"   Ошибка получения списка: {response.text}")
    
    # 3. Получение конкретного подразделения
    print(f"\n3. Получение информации о подразделении ID {dept_id}...")
    response = requests.get(f"{BASE_URL}/departments/{dept_id}", headers=headers)
    print(f"   Получение информации - Status: {response.status_code}")
    
    if response.status_code == 200:
        dept_info = response.json()
        print(f"   Информация о подразделении: {dept_info}")
    else:
        print(f"   Ошибка получения информации: {response.text}")
    
    # 4. Обновление подразделения
    print(f"\n4. Обновление подразделения ID {dept_id}...")
    update_data = {
        "name": "Обновленное тестовое подразделение",
        "manager_id": 5
    }
    
    response = requests.put(f"{BASE_URL}/departments/{dept_id}", json=update_data, headers=headers)
    print(f"   Обновление подразделения - Status: {response.status_code}")
    
    if response.status_code == 200:
        updated_dept = response.json()
        print(f"   Подразделение обновлено: {updated_dept}")
    else:
        print(f"   Ошибка обновления: {response.text}")
    
    # 5. Проверка, что обычный пользователь не может создавать подразделения
    print(f"\n5. Проверка защиты - обычный пользователь не должен иметь доступ...")
    
    # Получаем токен обычного пользователя
    user_login_data = {"username": "test", "password": "test"}
    user_response = requests.post(f"{BASE_URL}/auth/token", data=user_login_data)
    
    if user_response.status_code == 200:
        user_token_data = user_response.json()
        user_access_token = user_token_data['access_token']
        user_headers = {"Authorization": f"Bearer {user_access_token}"}
        
        # Пробуем создать подразделение от имени обычного пользователя
        response = requests.post(f"{BASE_URL}/departments/", json=new_dept_data, headers=user_headers)
        print(f"   Создание подразделения обычным пользователем - Status: {response.status_code}")
        
        if response.status_code == 403:  # Forbidden
            print("   ✓ Защита работает - обычный пользователь не может создавать подразделения")
        else:
            print(f"   ⚠ Ожидаемый статус 403, получен {response.status_code}")
    
    # 6. Удаление подразделения
    print(f"\n6. Удаление подразделения ID {dept_id}...")
    response = requests.delete(f"{BASE_URL}/departments/{dept_id}", headers=headers)
    print(f"   Удаление подразделения - Status: {response.status_code}")
    
    if response.status_code == 200:
        print("   Подразделение успешно удалено")
    else:
        print(f"   Ошибка удаления: {response.text}")

if __name__ == "__main__":
    test_department_operations()