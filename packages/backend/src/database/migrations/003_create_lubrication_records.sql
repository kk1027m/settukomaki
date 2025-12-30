CREATE TABLE IF NOT EXISTS lubrication_records (
  id SERIAL PRIMARY KEY,
  point_id INTEGER NOT NULL REFERENCES lubrication_points(id) ON DELETE CASCADE,
  performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  performed_by INTEGER REFERENCES users(id),
  next_due_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_lubrication_records_point ON lubrication_records(point_id);
CREATE INDEX idx_lubrication_records_due_date ON lubrication_records(next_due_date);
CREATE INDEX idx_lubrication_records_performed_at ON lubrication_records(performed_at DESC);
