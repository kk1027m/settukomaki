-- Calendar leaves table (有給休暇取得者)
CREATE TABLE IF NOT EXISTS calendar_leaves (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  employee_name VARCHAR(100) NOT NULL,
  note VARCHAR(255),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calendar_leaves_date ON calendar_leaves(date);
