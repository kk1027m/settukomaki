-- Create line_recipients table for storing multiple LINE group/user IDs
CREATE TABLE IF NOT EXISTS line_recipients (
  id SERIAL PRIMARY KEY,
  recipient_id VARCHAR(100) NOT NULL UNIQUE,
  recipient_type VARCHAR(20) NOT NULL DEFAULT 'group',
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_line_recipients_active ON line_recipients(is_active);

-- Migrate existing line_group_id from settings to new table
INSERT INTO line_recipients (recipient_id, recipient_type, name)
SELECT value, 'unknown', 'Initial recipient'
FROM settings
WHERE key = 'line_group_id' AND value IS NOT NULL AND value != ''
ON CONFLICT (recipient_id) DO NOTHING;
