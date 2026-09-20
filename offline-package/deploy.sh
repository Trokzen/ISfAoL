#!/bin/bash

# Скрипт для развёртывания на оффлайн-сервере
# Запускать после распаковки elibrary-offline-deployment.tar.gz

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
