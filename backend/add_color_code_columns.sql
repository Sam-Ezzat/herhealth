-- Add notes column to color_code table if it doesn't exist
ALTER TABLE color_code 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add is_active column if it doesn't exist
ALTER TABLE color_code 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add updated_at column if it doesn't exist
ALTER TABLE color_code 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to set is_active = TRUE where NULL
UPDATE color_code 
SET is_active = TRUE 
WHERE is_active IS NULL;
