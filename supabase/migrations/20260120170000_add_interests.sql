-- Add interests column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS interests TEXT[] DEFAULT '{}';
