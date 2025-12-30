CREATE TABLE IF NOT EXISTS part_history (
  id SERIAL PRIMARY KEY,
  part_id INTEGER NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('入庫', '出庫', '調整', '発注')),
  quantity INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  performed_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_part_history_part ON part_history(part_id);
CREATE INDEX idx_part_history_created ON part_history(created_at DESC);
