# Оффлайн Docker-развёртывание Elibrary

## Обзор

Этот проект настроен для полного оффлайн-развёртывания с использованием Docker.
Все необходимые образы могут быть сохранены в tar.gz архивы и перенесены на сервер без доступа к интернету.

## Структура проекта

```
/workspace
├── backend/           # FastAPI приложение
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/          # React приложение
│   ├── Dockerfile
│   └── nginx.conf
├── docker-postgres/   # Конфигурация PostgreSQL
│   ├── Dockerfile
│   └── Create_DB.sql
├── docker-compose.yml
└── OFFLINE_DEPLOYMENT.md
```

## Этапы оффлайн-развёртывания

### Этап 1: Подготовка на машине с интернетом

#### 1.1 Сохранение Docker образов в tar.gz архивы

```bash
# Перейдите в директорию проекта
cd /workspace

# Постройте все образы
docker-compose build

# Сохраните каждый образ в отдельный tar файл
docker save postgres:15-alpine -o ./offline-images/postgres.tar
docker save python:3.11-slim -o ./offline-images/python.tar
docker save node:20-alpine -o ./offline-images/node.tar
docker save nginx:alpine -o ./offline-images/nginx.tar

# Сохраните собранные образы приложения
docker save elibrary_db -o ./offline-images/elibrary_db.tar
docker save elibrary_backend -o ./offline-images/elibrary_backend.tar
docker save elibrary_frontend -o ./offline-images/elibrary_frontend.tar

# Альтернативно - сохранить всё в один архив
docker save postgres:15-alpine python:3.11-slim node:20-alpine nginx:alpine elibrary_db elibrary_backend elibrary_frontend | gzip > ./offline-images/all-images.tar.gz
```

#### 1.2 Создание скрипта для развёртывания

Создайте директорию для оффлайн-пакета:

```bash
mkdir -p /workspace/offline-package/images
mkdir -p /workspace/offline-package/project
```

Скопируйте файлы проекта:

```bash
cp -r backend/ /workspace/offline-package/project/
cp -r frontend/ /workspace/offline-package/project/
cp -r docker-postgres/ /workspace/offline-package/project/
cp docker-compose.yml /workspace/offline-package/project/
```

Сохраните все образы:

```bash
docker save postgres:15-alpine python:3.11-slim node:20-alpine nginx:alpine > /workspace/offline-package/images/base-images.tar
docker-compose build
docker save elibrary_db elibrary_backend elibrary_frontend > /workspace/offline-package/images/app-images.tar
```

Создайте скрипт развёртывания (см. deploy-offline.sh)

#### 1.3 Упаковка всего в один архив

```bash
cd /workspace/offline-package
tar -czvf ../elibrary-offline-deployment.tar.gz .
```

Теперь `elibrary-offline-deployment.tar.gz` можно перенести на оффлайн-сервер.

### Этап 2: Развёртывание на оффлайн-сервере

#### 2.1 Распаковка

```bash
# На оффлайн-сервере
mkdir -p /opt/elibrary
cd /opt/elibrary
tar -xzvf /path/to/elibrary-offline-deployment.tar.gz --strip-components=1
```

#### 2.2 Загрузка Docker образов

```bash
# Загрузка базовых образов
docker load -i images/base-images.tar

# Загрузка образов приложения
docker load -i images/app-images.tar
```

#### 2.3 Запуск приложения

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

## Быстрый старт (онлайн режим)

Если у вас есть доступ к Docker Hub, просто выполните:

```bash
cd /workspace
docker-compose up --build -d
```

Сервисы будут доступны по адресам:
- Frontend: http://localhost:80
- Backend API: http://localhost:8000
- PostgreSQL: localhost:5432

## Проверка работы

```bash
# Проверка здоровья сервисов
docker-compose ps

# Логи backend
docker-compose logs backend

# Логи frontend
docker-compose logs frontend

# Логи базы данных
docker-compose logs db

# Тестирование API
curl http://localhost:8000/
```

## Остановка и очистка

```bash
# Остановка всех сервисов
docker-compose down

# Остановка с удалением томов (данные БД будут удалены!)
docker-compose down -v

# Удаление всех образов
docker rmi $(docker images -q elibrary_*)
```

## Переменные окружения

Для настройки можно создать файл `.env` в корне проекта:

```env
# База данных
DB_HOST=db
DB_PORT=5432
DB_NAME=elibrary
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Backend
BACKEND_PORT=8000

# Frontend
FRONTEND_PORT=80
```

## Миграции базы данных

Миграции выполняются автоматически при запуске backend контейнера.
Для ручного запуска миграций:

```bash
docker-compose exec backend alembic upgrade head
```

## Примечания

1. **Безопасность**: В production замените пароли на безопасные значения
2. **Персистентность**: Данные БД сохраняются в volume `postgres_data`
3. **Сеть**: Все сервисы находятся в изолированной сети `elibrary_network`
4. **Порты**: Измените порты в docker-compose.yml при необходимости
