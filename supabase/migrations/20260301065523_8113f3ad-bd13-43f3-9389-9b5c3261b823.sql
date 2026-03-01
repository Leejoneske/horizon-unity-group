
-- Create savings_cycles table
CREATE TABLE public.savings_cycles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'upcoming')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_savings NUMERIC NOT NULL DEFAULT 0,
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.savings_cycles ENABLE ROW LEVEL SECURITY;

-- Everyone can view cycles (users need to know if cycle is active)
CREATE POLICY "Everyone can view cycles"
ON public.savings_cycles
FOR SELECT
USING (true);

-- Only admins can manage cycles
CREATE POLICY "Admins can manage cycles"
ON public.savings_cycles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
