-- Add activity tracking fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS password_reset_required BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on activity fields
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON public.profiles(last_login);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);
