CREATE TABLE IF NOT EXISTS lubrication_points (
  id SERIAL PRIMARY KEY,
  machine_name VARCHAR(100) NOT NULL,
  location VARCHAR(200) NOT NULL,
  cycle_days INTEGER NOT NULL DEFAULT 30,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(machine_name, location)
);

CREATE INDEX idx_lubrication_points_machine ON lubrication_points(machine_name);
CREATE INDEX idx_lubrication_points_active ON lubrication_points(is_active);
