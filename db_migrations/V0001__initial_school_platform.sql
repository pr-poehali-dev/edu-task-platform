
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('teacher', 'student')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  description TEXT NOT NULL,
  deadline TIMESTAMP,
  max_score INTEGER DEFAULT 100,
  teacher_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE solutions (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER REFERENCES assignments(id),
  student_id INTEGER REFERENCES users(id),
  solution_text TEXT NOT NULL,
  answer_text VARCHAR(500),
  submitted_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

CREATE TABLE grades (
  id SERIAL PRIMARY KEY,
  solution_id INTEGER REFERENCES solutions(id) UNIQUE,
  score INTEGER,
  comment TEXT,
  graded_at TIMESTAMP DEFAULT NOW(),
  graded_by INTEGER REFERENCES users(id)
);

INSERT INTO users (username, password_hash, full_name, role)
VALUES ('Админ22', '22', 'Преподаватель', 'teacher');
