-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT 'blue',
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar day colors table
CREATE TABLE IF NOT EXISTS calendar_day_colors (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  color VARCHAR(20) NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_calendar_day_colors_date ON calendar_day_colors(date);
