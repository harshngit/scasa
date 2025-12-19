-- Add owner_history column to residents table
-- This will store an array of previous owner records

ALTER TABLE residents 
ADD COLUMN IF NOT EXISTS owner_history JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the field
COMMENT ON COLUMN residents.owner_history IS 'Array of previous owner records. Each record contains the same fields as the current owner record (owner_name, phone_number, email, residency_type, residents_living, vehicle_detail, documents, rental information, etc.) along with a changed_at timestamp.';

