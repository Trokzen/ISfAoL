# Конфигурация базы данных

## 📁 Структура

```
backend/
├── config/
│   ├── __init__.py          # Инициализация пакета
│   └── database.py          # Конфигурация БД
├── database.py              # Подключение к БД (использует config)
├── .env                     # Ваши настройки (не коммитить!)
└── .env.example            # Шаблон настроек
```

## 🔧 Использование

### 1. Получение конфигурации

```python
from config.database import db_config

# Доступ к настройкам
print(db_config.host)      # localhost
print(db_config.port)      # 5432
print(db_config.database)  # postgres
print(db_config.username)  # postgres
print(db_config.password)  # 1234
```

### 2. Получение URL подключения

```python
from config.database import get_database_url

url = get_database_url()
# postgresql://postgres:1234@localhost:5432/postgres
```

### 3. Безопасный URL (для логирования)

```python
from config.database import db_config

safe_url = db_config.url_safe
# postgresql://postgres:***@localhost:5432/postgres
```

## 📝 Настройки в .env

```env
# Основные настройки
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=1234

# Дополнительные настройки (необязательно)
DB_ECHO=false             # Логирование SQL
DB_POOL_SIZE=5            # Размер пула соединений
DB_MAX_OVERFLOW=10        # Макс. превышение пула
```

## 🧪 Тестирование

Запустите тестовый скрипт:

```bash
cd backend
python test_db_config.py
```

## 🎯 Преимущества

1. **Централизованная конфигурация** - все настройки в одном месте
2. **Безопасность** - пароль скрыт в .env файле
3. **Гибкость** - легко менять настройки через переменные окружения
4. **Тестируемость** - можно проверить конфигурацию через тест
5. **Документированность** - все настройки с комментариями
