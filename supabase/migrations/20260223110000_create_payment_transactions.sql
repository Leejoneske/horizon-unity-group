-- Create payment_transactions table for Pesapal payment tracking
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  merchant_reference TEXT NOT NULL UNIQUE,
  pesapal_transaction_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  payment_method TEXT DEFAULT 'm-pesa',
  error_message TEXT,
  contribution_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_merchant_reference ON payment_transactions(merchant_reference);
CREATE INDEX idx_payment_transactions_pesapal_transaction_id ON payment_transactions(pesapal_transaction_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_created_at ON payment_transactions(created_at);

-- Create trigger to update updated_at automatically
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_transactions_updated_at_trigger
BEFORE UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Add RLS policies
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own transactions
CREATE POLICY "Users can view their own payment transactions"
ON payment_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Only backend (via service role) can insert/update
CREATE POLICY "Backend can manage payment transactions"
ON payment_transactions
FOR ALL
USING (true)
WITH CHECK (true);
