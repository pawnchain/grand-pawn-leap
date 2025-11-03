-- Drop the trigger that was causing foreign key violations
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- We'll handle user_roles creation manually in the application code after profile creation