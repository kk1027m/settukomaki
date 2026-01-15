-- Troubleshooting items table (トラブルシューティング)
CREATE TABLE IF NOT EXISTS troubleshooting_items (
  id SERIAL PRIMARY KEY,
  machine_name VARCHAR(100) NOT NULL,
  unit_name VARCHAR(100),
  trouble_title VARCHAR(255) NOT NULL,
  trouble_description TEXT,
  solution TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_troubleshooting_items_machine ON troubleshooting_items(machine_name);
CREATE INDEX IF NOT EXISTS idx_troubleshooting_items_unit ON troubleshooting_items(unit_name);
CREATE INDEX IF NOT EXISTS idx_troubleshooting_items_active ON troubleshooting_items(is_active);
CREATE INDEX IF NOT EXISTS idx_troubleshooting_items_sort ON troubleshooting_items(sort_order);
