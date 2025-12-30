-- Add unit column to lubrication_points table
ALTER TABLE lubrication_points
ADD COLUMN IF NOT EXISTS unit_name VARCHAR(100);

-- Add unit column to parts table
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS unit_name VARCHAR(100);

-- Create indexes for unit filtering
CREATE INDEX IF NOT EXISTS idx_lubrication_points_unit ON lubrication_points(unit_name);
CREATE INDEX IF NOT EXISTS idx_parts_unit ON parts(unit_name);
