-- Calendar week shifts table (A班/B班設定)
CREATE TABLE IF NOT EXISTS calendar_week_shifts (
  id SERIAL PRIMARY KEY,
  sunday_date DATE NOT NULL UNIQUE,
  shift CHAR(1) NOT NULL DEFAULT 'A' CHECK (shift IN ('A', 'B')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_calendar_week_shifts_date ON calendar_week_shifts(sunday_date);
