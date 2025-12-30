CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('lubrication_point', 'part')),
  entity_id INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attachments_entity ON attachments(entity_type, entity_id);
