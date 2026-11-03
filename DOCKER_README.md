# Docker-конфигурация для Elibrary

## Быстрый старт (онлайн)

```bash
# Запуск всех сервисов
docker-compose up --build -d

# Проверка статуса
docker-compose ps

# Сервисы доступны по адресам:
# Frontend: http://localhost:80
# Backend API: http://localhost:8000
# PostgreSQL: localhost:5432
```

## Оффлайн-развёртывание

### Шаг 1: Создание оффлайн-пакета (на машине с интернетом)

```bash
./create-offline-package.sh
```

Этот скрипт:
1. Скачает все необходимые базовые образы (PostgreSQL, Python, Node.js, Nginx)
2. Построит образы приложения
3. Сохранит всё в архив `elibrary-offline-deployment.tar.gz`

### Шаг 2: Развёртывание на оффлайн-сервере

```bash
# Распаковать архив
tar -xzvf elibrary-offline-deployment.tar.gz

# Запустить развёртывание
./deploy.sh
```

## Структура файлов

```
/workspace
├── docker-compose.yml              # Конфигурация Docker Compose
├── backend/
│   └── Dockerfile                  # Dockerfile для FastAPI backend
├── frontend/
│   ├── Dockerfile                  # Dockerfile для React frontend
│   └── nginx.conf                  # Конфигурация Nginx
├── docker-postgres/
│   ├── Dockerfile                  # Dockerfile для PostgreSQL
│   └── Create_DB.sql              # Скрипт инициализации БД
├── create-offline-package.sh       # Скрипт создания оффлайн-пакета
├── offline-package/
│   └── deploy.sh                   # Скрипт развёртывания на оффлайн-сервере
└── OFFLINE_DEPLOYMENT.md           # Подробная документация
```

## Управление сервисами

```bash
# Просмотр логов
docker-compose logs -f           # Все сервисы
docker-compose logs backend      # Только backend
docker-compose logs frontend     # Только frontend
docker-compose logs db           # Только база данных

# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Полная очистка (включая данные БД!)
docker-compose down -v
```

## Миграции базы данных

Миграции выполняются автоматически при запуске backend. Для ручного запуска:

```bash
docker-compose exec backend alembic upgrade head
```

## Настройка

Для изменения параметров создайте файл `.env`:

```env
DB_PASSWORD=your_secure_password
BACKEND_PORT=8000
FRONTEND_PORT=80
```

## Компоненты

- **PostgreSQL 15** - база данных
- **FastAPI** - backend API (Python 3.11)
- **React + Vite** - frontend (сборка через Node.js 20)
- **Nginx** - раздача статических файлов frontend
