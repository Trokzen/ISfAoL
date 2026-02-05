-- Добавляем поля в таблицу users для поддержки ролей
ALTER TABLE elibrary.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE elibrary.users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE elibrary.users ADD COLUMN IF NOT EXISTS department TEXT;

-- Проверяем, что таблица employees существует
-- Если она была удалена, создаем снова
CREATE TABLE IF NOT EXISTS elibrary.employees (
    id SERIAL PRIMARY KEY,
    FIO TEXT NOT NULL
);

-- Проверяем, что таблица departments существует
CREATE TABLE IF NOT EXISTS elibrary.departments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

-- Проверяем, что таблица employee_departments существует
CREATE TABLE IF NOT EXISTS elibrary.employee_departments (
    employee_id INTEGER NOT NULL,
    department_id INTEGER NOT NULL,
    PRIMARY KEY (employee_id, department_id),
    FOREIGN KEY (employee_id) REFERENCES elibrary.employees(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES elibrary.departments(id) ON DELETE CASCADE
);

-- Проверяем, что таблица employee_articles существует
CREATE TABLE IF NOT EXISTS elibrary.employee_articles (
    employee_id INTEGER NOT NULL,
    article_id INTEGER NOT NULL,
    PRIMARY KEY (employee_id, article_id),
    FOREIGN KEY (employee_id) REFERENCES elibrary.employees(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES elibrary.articles(id) ON DELETE CASCADE
);

-- Обновляем индекс для ускорения поиска по логину
CREATE INDEX IF NOT EXISTS idx_users_login ON elibrary.users(login);