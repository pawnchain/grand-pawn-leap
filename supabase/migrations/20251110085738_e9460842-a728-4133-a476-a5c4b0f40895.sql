-- Add unique constraint to plans table type column
-- This ensures each plan type (princess, prince, queen, king) appears only once
-- and enables idempotent seed scripts using ON CONFLICT

ALTER TABLE public.plans 
ADD CONSTRAINT plans_type_unique UNIQUE (type);