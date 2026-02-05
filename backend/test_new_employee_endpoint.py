import requests

# Тестируем новый эндпоинт для создания сотрудника с деталями
BASE_URL = "http://127.0.0.1:8001"

def test_new_employee_endpoint():
    print("=== Testing new employee endpoint ===")
    
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
    
    # Сначала получим список подразделений
    print("\nGetting departments list...")
    response = requests.get(f"{BASE_URL}/departments/", headers=headers)
    print(f"GET /departments/ - Status: {response.status_code}")
    
    if response.status_code == 200:
        departments = response.json()
        print(f"Found {len(departments)} departments:")
        for dept in departments:
            print(f"  - ID: {dept['id']}, Name: {dept['name']}")
        
        if departments:
            # Попробуем создать нового сотрудника с деталями
            print(f"\nTesting POST /employees/with-details ...")
            employee_data = {
                "first_name": "Тест",
                "last_name": "Сотрудник",
                "middle_name": "Тестович",
                "department_ids": [departments[0]['id']],  # Используем ID первого подразделения
                "position": "Тестовая должность",
                "email": "test.employee@example.com",
                "phone": "+7 (999) 999-99-99"
            }
            
            response = requests.post(f"{BASE_URL}/employees/with-details", json=employee_data, headers=headers)
            print(f"POST /employees/with-details - Status: {response.status_code}")
            
            if response.status_code == 200:
                employee = response.json()
                print(f"Employee created successfully: {employee}")
                
                # Проверим, что сотрудник был создан
                emp_id = employee['id']
                response = requests.get(f"{BASE_URL}/employees/{emp_id}", headers=headers)
                print(f"GET /employees/{emp_id} - Status: {response.status_code}")
                
                if response.status_code == 200:
                    emp_details = response.json()
                    print(f"Employee details: {emp_details}")
                    
                    # Удалим тестового сотрудника
                    response = requests.delete(f"{BASE_URL}/employees/{emp_id}", headers=headers)
                    print(f"DELETE /employees/{emp_id} - Status: {response.status_code}")
                    if response.status_code == 200:
                        print("Test employee deleted successfully")
            else:
                print(f"Error creating employee: {response.text}")
        else:
            print("No departments found to test with")
    else:
        print(f"Error getting departments: {response.text}")

if __name__ == "__main__":
    test_new_employee_endpoint()