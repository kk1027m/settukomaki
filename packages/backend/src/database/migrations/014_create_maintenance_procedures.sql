CREATE TABLE IF NOT EXISTS maintenance_procedures (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('machine', 'unit', 'common')),
  machine_name VARCHAR(100),
  unit_name VARCHAR(100),
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_maintenance_procedures_category ON maintenance_procedures(category);
CREATE INDEX idx_maintenance_procedures_machine ON maintenance_procedures(machine_name);
CREATE INDEX idx_maintenance_procedures_unit ON maintenance_procedures(unit_name);
CREATE INDEX idx_maintenance_procedures_created_at ON maintenance_procedures(created_at DESC);
