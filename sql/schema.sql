CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(64) NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  question_text TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS answers (
  id SERIAL PRIMARY KEY,
  answer TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE
);