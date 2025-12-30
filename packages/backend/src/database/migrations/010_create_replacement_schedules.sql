-- Create replacement schedules table
CREATE TABLE IF NOT EXISTS replacement_schedules (
  id SERIAL PRIMARY KEY,
  machine_name VARCHAR(100) NOT NULL,
  unit_name VARCHAR(100),
  part_name VARCHAR(200) NOT NULL,
  part_number VARCHAR(50),
  cycle_days INTEGER NOT NULL DEFAULT 90,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(machine_name, part_name)
);

-- Create replacement records table
CREATE TABLE IF NOT EXISTS replacement_records (
  id SERIAL PRIMARY KEY,
  schedule_id INTEGER NOT NULL REFERENCES replacement_schedules(id) ON DELETE CASCADE,
  replaced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  replaced_by INTEGER REFERENCES users(id),
  next_due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_replacement_schedules_machine ON replacement_schedules(machine_name);
CREATE INDEX IF NOT EXISTS idx_replacement_schedules_unit ON replacement_schedules(unit_name);
CREATE INDEX IF NOT EXISTS idx_replacement_schedules_active ON replacement_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_replacement_records_schedule ON replacement_records(schedule_id);
CREATE INDEX IF NOT EXISTS idx_replacement_records_due_date ON replacement_records(next_due_date);
