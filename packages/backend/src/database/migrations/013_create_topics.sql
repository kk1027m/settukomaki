CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  posted_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_topics_posted_by ON topics(posted_by);
CREATE INDEX idx_topics_created_at ON topics(created_at DESC);
