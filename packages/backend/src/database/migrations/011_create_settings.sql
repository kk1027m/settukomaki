-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default notification schedule settings
INSERT INTO settings (key, value, description) VALUES
  ('notification_lubrication_time', '8:00', '給油チェック通知の時間（HH:MM形式）'),
  ('notification_replacement_time', '8:15', '部品交換チェック通知の時間（HH:MM形式）'),
  ('notification_stock_time', '9:00', '在庫チェック通知の時間（HH:MM形式）')
ON CONFLICT (key) DO NOTHING;
