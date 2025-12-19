-- Create complaints table
CREATE TABLE IF NOT EXISTS complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complainer_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  flat_number TEXT,
  wing TEXT,
  complaint_text TEXT NOT NULL,
  complaint_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_complainer_name ON complaints(complainer_name);
CREATE INDEX IF NOT EXISTS idx_complaints_flat_number ON complaints(flat_number);
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_date ON complaints(complaint_date);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at);

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read complaints" ON complaints
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert complaints" ON complaints
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update complaints" ON complaints
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete complaints" ON complaints
  FOR DELETE
  USING (true);

-- For development, allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON complaints
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_complaints_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER complaints_updated_at
  BEFORE UPDATE ON complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_complaints_updated_at();

