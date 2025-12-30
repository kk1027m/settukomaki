-- Add unit_name and shelf_box_name columns to parts table
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS unit_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS shelf_box_name VARCHAR(200);
