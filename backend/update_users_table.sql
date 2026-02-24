-- Добавляем поле fio в таблицу users для совместимости с моделью
ALTER TABLE elibrary.users ADD COLUMN fio VARCHAR(255);

-- Обновляем существующие записи, чтобы fio совпадало с full_name
UPDATE elibrary.users SET fio = full_name WHERE fio IS NULL;