-- Add payment_mode and payment_details columns to billing_history table
ALTER TABLE billing_history
ADD COLUMN IF NOT EXISTS payment_mode TEXT,
ADD COLUMN IF NOT EXISTS payment_details TEXT;

-- Create index on payment_mode for better query performance
CREATE INDEX IF NOT EXISTS idx_billing_history_payment_mode ON billing_history(payment_mode);

-- Add comment to columns
COMMENT ON COLUMN billing_history.payment_mode IS 'Payment method used (cash, bank_transfer, cheque, upi, etc.)';
COMMENT ON COLUMN billing_history.payment_details IS 'Additional payment details (cheque number, transaction ID, UPI reference, etc.)';

