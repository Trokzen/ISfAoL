#!/bin/bash

# Скрипт для создания оффлайн-пакета Docker образов
# Запускать на машине с интернетом

set -e

echo "=== Создание оффлайн-пакета для Elibrary ==="

# Создаём директорию для пакета
OFFLINE_DIR="./offline-package"
IMAGES_DIR="$OFFLINE_DIR/images"
PROJECT_DIR="$OFFLINE_DIR/project"

mkdir -p "$IMAGES_DIR"
mkdir -p "$PROJECT_DIR"

# Копируем файлы проекта
echo "Копирование файлов проекта..."
cp -r backend/ "$PROJECT_DIR/"
cp -r frontend/ "$PROJECT_DIR/"
cp -r docker-postgres/ "$PROJECT_DIR/"
cp docker-compose.yml "$PROJECT_DIR/"
cp OFFLINE_DEPLOYMENT.md "$PROJECT_DIR/"
cp Create_DB.sql "$PROJECT_DIR/"

# Сохраняем базовые образы
echo "Сохранение базовых Docker образов..."
docker pull postgres:15-alpine
docker pull python:3.11-slim
docker pull node:20-alpine
docker pull nginx:alpine

docker save postgres:15-alpine python:3.11-slim node:20-alpine nginx:alpine > "$IMAGES_DIR/base-images.tar"

# Строим и сохраняем образы приложения
echo "Построение образов приложения..."
cd "$PROJECT_DIR"
docker-compose build

echo "Сохранение образов приложения..."
docker save elibrary_db elibrary_backend elibrary_frontend > "$IMAGES_DIR/app-images.tar"

cd ..

# Создаём скрипт развёртывания
cat > "$OFFLINE_DIR/deploy.sh" << 'DEPLOY_SCRIPT'
#!/bin/bash

# Скрипт для развёртывания на оффлайн-сервере
set -e

echo "=== Развёртывание Elibrary ==="

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR/project"

echo "Загрузка базовых образов..."
docker load -i "$SCRIPT_DIR/images/base-images.tar"

echo "Загрузка образов приложения..."
docker load -i "$SCRIPT_DIR/images/app-images.tar"

echo "Запуск сервисов..."
cd "$PROJECT_DIR"
docker-compose up -d

echo ""
echo "=== Готово! ==="
echo "Frontend: http://localhost:80"
echo "Backend API: http://localhost:8000"
echo "PostgreSQL: localhost:5432"
echo ""
echo "Для просмотра логов: docker-compose logs -f"
echo "Для остановки: docker-compose down"
DEPLOY_SCRIPT

chmod +x "$OFFLINE_DIR/deploy.sh"

# Упаковываем всё в tar.gz
echo "Упаковка в архив..."
tar -czvf ./elibrary-offline-deployment.tar.gz -C "$OFFLINE_DIR" .

echo ""
echo "=== Оффлайн-пакет создан! ==="
echo "Файл: ./elibrary-offline-deployment.tar.gz"
echo ""
echo "Размер:"
ls -lh ./elibrary-offline-deployment.tar.gz
echo ""
echo "Для развёртывания на оффлайн-сервере:"
echo "  1. Скопируйте elibrary-offline-deployment.tar.gz на сервер"
echo "  2. Распакуйте: tar -xzvf elibrary-offline-deployment.tar.gz"
echo "  3. Запустите: ./deploy.sh"
