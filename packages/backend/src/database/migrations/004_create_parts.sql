CREATE TABLE IF NOT EXISTS parts (
  id SERIAL PRIMARY KEY,
  part_number VARCHAR(50) UNIQUE,
  part_name VARCHAR(200) NOT NULL,
  current_stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT '個',
  location VARCHAR(200),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parts_name ON parts(part_name);
CREATE INDEX idx_parts_number ON parts(part_number);
CREATE INDEX idx_parts_stock_alert ON parts(current_stock, min_stock) WHERE is_active = true;
