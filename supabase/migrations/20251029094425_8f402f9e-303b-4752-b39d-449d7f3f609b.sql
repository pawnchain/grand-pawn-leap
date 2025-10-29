-- Update plan prices to the new Nigerian Naira amounts
UPDATE public.plans SET price = 20000, payout = 60000, referral_bonus = 2000 WHERE type = 'king';
UPDATE public.plans SET price = 10000, payout = 30000, referral_bonus = 1000 WHERE type = 'queen';
UPDATE public.plans SET price = 5000, payout = 15000, referral_bonus = 500 WHERE type = 'prince';
UPDATE public.plans SET price = 2000, payout = 6000, referral_bonus = 200 WHERE type = 'princess';

-- Enable realtime for triangle_members table so users can see updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.triangle_members;