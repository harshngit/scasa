-- Create society_owned_rooms table
CREATE TABLE IF NOT EXISTS society_owned_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  floor_number TEXT,
  area_sqft NUMERIC(10, 2),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
  tenant_name TEXT,
  tenant_phone TEXT,
  tenant_email TEXT,
  rent_amount NUMERIC(10, 2),
  rent_start_date DATE,
  rent_end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_society_owned_rooms_room_number ON society_owned_rooms(room_number);
CREATE INDEX IF NOT EXISTS idx_society_owned_rooms_room_type ON society_owned_rooms(room_type);
CREATE INDEX IF NOT EXISTS idx_society_owned_rooms_status ON society_owned_rooms(status);
CREATE INDEX IF NOT EXISTS idx_society_owned_rooms_tenant_name ON society_owned_rooms(tenant_name);
CREATE INDEX IF NOT EXISTS idx_society_owned_rooms_created_at ON society_owned_rooms(created_at);

-- Enable RLS
ALTER TABLE society_owned_rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all access for authenticated users
CREATE POLICY "Allow authenticated users to read society_owned_rooms" ON society_owned_rooms
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert society_owned_rooms" ON society_owned_rooms
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update society_owned_rooms" ON society_owned_rooms
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete society_owned_rooms" ON society_owned_rooms
  FOR DELETE
  USING (true);

-- For development, allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON society_owned_rooms
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_society_owned_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER society_owned_rooms_updated_at
  BEFORE UPDATE ON society_owned_rooms
  FOR EACH ROW
  EXECUTE FUNCTION update_society_owned_rooms_updated_at();

