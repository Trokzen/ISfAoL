# PostgreSQL Dockerfile с предзагруженными данными
FROM postgres:15-alpine

# Установка переменных окружения по умолчанию
ENV POSTGRES_DB=elibrary
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Копирование SQL скрипта для инициализации
COPY Create_DB.sql /docker-entrypoint-initdb.d/

# Порт PostgreSQL
EXPOSE 5432
