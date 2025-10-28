-- Add referral_code field to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code_used text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_triangle_members_triangle_id ON triangle_members(triangle_id);
CREATE INDEX IF NOT EXISTS idx_triangle_members_user_id ON triangle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_triangles_plan_type ON triangles(plan_type);
CREATE INDEX IF NOT EXISTS idx_triangles_is_active ON triangles(is_active);

-- Update withdrawals table to track telegram info
ALTER TABLE withdrawals ADD COLUMN IF NOT EXISTS telegram_username text;