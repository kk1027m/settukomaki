-- Add start_time column to calendar_events table
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS start_time TIME;

-- Update index for better query performance
CREATE INDEX IF NOT EXISTS idx_calendar_events_date_time ON calendar_events(date, start_time);
