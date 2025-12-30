CREATE TABLE IF NOT EXISTS procedure_comments (
  id SERIAL PRIMARY KEY,
  procedure_id INTEGER NOT NULL REFERENCES maintenance_procedures(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  commented_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_procedure_comments_procedure ON procedure_comments(procedure_id);
CREATE INDEX idx_procedure_comments_created_at ON procedure_comments(created_at DESC);
