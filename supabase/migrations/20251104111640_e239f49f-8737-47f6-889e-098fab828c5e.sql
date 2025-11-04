-- Create expenses table for tracking operational costs
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to manage expenses
CREATE POLICY "Admins can manage all expenses"
ON public.expenses
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));