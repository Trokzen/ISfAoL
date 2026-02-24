-- Создание схемы
DROP SCHEMA IF EXISTS elibrary CASCADE;
CREATE SCHEMA elibrary AUTHORIZATION postgres;

-- Таблица пользователей-сотрудников
CREATE TABLE elibrary.users (
    id SERIAL PRIMARY KEY,
    login VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'user',
    full_name VARCHAR(255) NOT NULL,
    id_elibrary_user VARCHAR(255) NOT NULL,  -- совпадает с full_name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица подразделений
CREATE TABLE elibrary.departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    manager_id INT REFERENCES elibrary.users(id)
);

-- Промежуточная таблица для связи сотрудников и подразделений (многие ко многим)
CREATE TABLE elibrary.user_departments (
    user_id INT REFERENCES elibrary.users(id) ON DELETE CASCADE,
    department_id INT REFERENCES elibrary.departments(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT FALSE,  -- указывает, является ли это основным подразделением
    position_title VARCHAR(255),       -- должность в данном подразделении
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, department_id)
);

-- Таблица статей
CREATE TABLE elibrary.articles (
    id SERIAL PRIMARY KEY,
    external_id INTEGER UNIQUE,  -- ID из внешней системы elibrary (опционально)
    title VARCHAR NOT NULL,
    year_pub INTEGER NOT NULL,
    in_rinc BOOLEAN DEFAULT FALSE
);

-- Таблица авторов (внутренних и внешних)
CREATE TABLE elibrary.authors (
    id SERIAL PRIMARY KEY,
    article_id INTEGER NOT NULL,
    author_name TEXT NOT NULL,  -- имя автора как оно указано в статье
    user_employee_id INTEGER,  -- ID сотрудника (если это внутренний автор)
    contribution REAL CHECK(contribution BETWEEN 0 AND 100),
    applied_for_award BOOLEAN NOT NULL DEFAULT FALSE,
    award_applied_date DATE,
    FOREIGN KEY (article_id) REFERENCES elibrary.articles(id) ON DELETE CASCADE,
    FOREIGN KEY (user_employee_id) REFERENCES elibrary.users(id)
);

-- Промежуточная таблица для связи сотрудников и статей (если нужно отдельно от авторов)
CREATE TABLE elibrary.employee_articles (
    employee_id INT REFERENCES elibrary.users(id) ON DELETE CASCADE,
    article_id INT REFERENCES elibrary.articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (employee_id, article_id)
);

-- Индексы для производительности
CREATE INDEX idx_articles_external_id ON elibrary.articles (external_id);
CREATE INDEX idx_articles_year_pub ON elibrary.articles (year_pub);
CREATE INDEX idx_articles_in_rinc ON elibrary.articles (in_rinc);
CREATE INDEX idx_authors_article_id ON elibrary.authors (article_id);
CREATE INDEX idx_authors_user_employee_id ON elibrary.authors (user_employee_id);
CREATE INDEX idx_users_role ON elibrary.users (role);
CREATE INDEX idx_user_departments_user_id ON elibrary.user_departments (user_id);
CREATE INDEX idx_user_departments_department_id ON elibrary.user_departments (department_id);