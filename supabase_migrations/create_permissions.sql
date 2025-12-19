-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  flat_number TEXT,
  wing TEXT,
  permission_text TEXT NOT NULL,
  permission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_permissions_resident_name ON permissions(resident_name);
CREATE INDEX IF NOT EXISTS idx_permissions_flat_number ON permissions(flat_number);
CREATE INDEX IF NOT EXISTS idx_permissions_permission_date ON permissions(permission_date);
CREATE INDEX IF NOT EXISTS idx_permissions_created_at ON permissions(created_at);

-- Enable RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read permissions" ON permissions
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert permissions" ON permissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update permissions" ON permissions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete permissions" ON permissions
  FOR DELETE
  USING (true);

-- For development, allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON permissions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER permissions_updated_at
  BEFORE UPDATE ON permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_permissions_updated_at();

