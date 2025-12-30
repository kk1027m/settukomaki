CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('lubrication_due', 'lubrication_overdue', 'low_stock', 'order_request')),
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  entity_type VARCHAR(50),
  entity_id INTEGER,
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unsent ON notifications(is_sent) WHERE is_sent = false;
