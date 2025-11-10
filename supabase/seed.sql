-- Seed script for PawnEarn database
-- This script is idempotent and can be run multiple times safely

-- Insert plans if they don't exist
INSERT INTO public.plans (type, name, price, payout, referral_bonus) VALUES
  ('princess', 'Princess', 2000.00, 8000.00, 200.00),
  ('prince', 'Prince', 5000.00, 20000.00, 500.00),
  ('queen', 'Queen', 10000.00, 40000.00, 1000.00),
  ('king', 'King', 20000.00, 80000.00, 2000.00)
ON CONFLICT (type) DO NOTHING;

-- Note: Admin user creation is handled automatically by the handle_new_user() trigger
-- The first user to sign up will automatically be assigned the 'admin' role
