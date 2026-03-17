"""
Конфигурация подключения к базе данных.

Этот файл содержит все настройки для подключения к PostgreSQL.
Значения загружаются из переменных окружения (.env файла).
"""

import os
from dotenv import load_dotenv

# Загружаем переменные окружения из .env файла
load_dotenv()


class DatabaseConfig:
    """
    Класс конфигурации базы данных.
    
    Пример использования:
        from config.database import DatabaseConfig
        db_config = DatabaseConfig()
        print(db_config.url)  # postgresql://user:pass@host:port/dbname
    """
    
    def __init__(self):
        # Сначала пробуем загрузить DATABASE_URL (старый формат)
        database_url = os.getenv("DATABASE_URL")
        
        if database_url:
            # Используем готовый URL
            self._url = database_url
            # Парсим компоненты из URL (для совместимости)
            from urllib.parse import urlparse
            parsed = urlparse(database_url)
            self.username = parsed.username or ''
            self.password = parsed.password or ''
            self.host = parsed.hostname or ''
            self.port = parsed.port or 5432
            self.database = parsed.path.lstrip('/') or ''
        else:
            # Используем отдельные переменные (новый формат)
            self.host = os.getenv("DB_HOST")
            self.port = int(os.getenv("DB_PORT", "5432"))
            self.database = os.getenv("DB_NAME")
            self.username = os.getenv("DB_USER")
            self.password = os.getenv("DB_PASSWORD")
            
            # Проверяем, что все параметры указаны
            if not all([self.host, self.database, self.username, self.password]):
                raise ValueError(
                    "Необходимо указать DATABASE_URL или все параметры БД "
                    "(DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD) в файле .env"
                )

        # Дополнительные настройки
        self.echo = os.getenv("DB_ECHO", "false").lower() == "true"
        self.pool_size = int(os.getenv("DB_POOL_SIZE", "5"))
        self.max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "10"))
        
    @property
    def url(self) -> str:
        """
        Возвращает URL подключения к базе данных.
        
        Формат: postgresql://username:password@host:port/database
        """
        return (
            f"postgresql://{self.username}:{self.password}"
            f"@{self.host}:{self.port}/{self.database}"
        )
    
    @property
    def url_safe(self) -> str:
        """
        Возвращает URL подключения без пароля (для логирования).
        
        Формат: postgresql://username:***@host:port/database
        """
        return (
            f"postgresql://{self.username}:***"
            f"@{self.host}:{self.port}/{self.database}"
        )
    
    def __repr__(self) -> str:
        return (
            f"DatabaseConfig(host='{self.host}', port={self.port}, "
            f"database='{self.database}', username='{self.username}')"
        )


# Создаём глобальный экземпляр конфигурации
db_config = DatabaseConfig()


# Функция для получения URL подключения (для обратной совместимости)
def get_database_url() -> str:
    """
    Возвращает URL подключения к базе данных.
    
    Returns:
        str: URL подключения в формате postgresql://user:pass@host:port/dbname
    """
    return db_config.url


# Для отладки - вывод информации о конфигурации
if __name__ == "__main__":
    print("=== Конфигурация базы данных ===")
    print(f"Хост: {db_config.host}")
    print(f"Порт: {db_config.port}")
    print(f"База данных: {db_config.database}")
    print(f"Пользователь: {db_config.username}")
    print(f"URL (безопасный): {db_config.url_safe}")
    print(f"URL (полный): {db_config.url}")
    print(f"Логирование SQL: {db_config.echo}")
    print(f"Размер пула: {db_config.pool_size}")
    print(f"Макс. превышение: {db_config.max_overflow}")
    print("================================")
