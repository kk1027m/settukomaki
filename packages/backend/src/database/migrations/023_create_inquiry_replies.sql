-- 問い合わせ返信テーブル
CREATE TABLE IF NOT EXISTS inquiry_replies (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_by_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inquiry_replies_inquiry_id ON inquiry_replies(inquiry_id);
CREATE INDEX idx_inquiry_replies_created_at ON inquiry_replies(created_at);
