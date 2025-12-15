-- Create maintenance_payments table
CREATE TABLE IF NOT EXISTS maintenance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id UUID REFERENCES residents(id) ON DELETE CASCADE,
  flat_number TEXT NOT NULL,
  resident_name TEXT NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 2000.00,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('paid', 'unpaid', 'overdue', 'partial')),
  payment_method TEXT,
  receipt_number TEXT,
  late_fee NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_resident_id ON maintenance_payments(resident_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_flat_number ON maintenance_payments(flat_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_month_year ON maintenance_payments(month, year);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_status ON maintenance_payments(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_payments_due_date ON maintenance_payments(due_date);

-- Enable RLS
ALTER TABLE maintenance_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read maintenance payments" ON maintenance_payments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert maintenance payments" ON maintenance_payments
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update maintenance payments" ON maintenance_payments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete maintenance payments" ON maintenance_payments
  FOR DELETE
  USING (true);

-- For development, allow anonymous access
CREATE POLICY "Allow anonymous access for development" ON maintenance_payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER maintenance_payments_updated_at
  BEFORE UPDATE ON maintenance_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_payments_updated_at();

