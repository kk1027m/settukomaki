-- Add end_date column to calendar_events for multi-day events
ALTER TABLE calendar_events
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Create index for date range queries
CREATE INDEX IF NOT EXISTS idx_calendar_events_end_date ON calendar_events(end_date);
