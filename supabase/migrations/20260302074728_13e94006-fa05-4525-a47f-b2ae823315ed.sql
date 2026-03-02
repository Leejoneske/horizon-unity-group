
-- Create payment_transactions table for PesaPal payments
CREATE TABLE public.payment_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  merchant_reference TEXT NOT NULL UNIQUE,
  amount NUMERIC NOT NULL,
  phone_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  pesapal_transaction_id TEXT,
  contribution_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all payment transactions
CREATE POLICY "Admins can manage payment transactions"
ON public.payment_transactions FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own payment transactions
CREATE POLICY "Users can view their own payments"
ON public.payment_transactions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own payment transactions
CREATE POLICY "Users can insert their own payments"
ON public.payment_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Service role needs to update payment status (via edge functions)
-- This is handled by the service role key in edge functions
