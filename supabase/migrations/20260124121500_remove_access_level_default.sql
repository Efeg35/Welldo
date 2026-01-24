-- Remove default value for access_level in channels table
ALTER TABLE public.channels ALTER COLUMN access_level DROP DEFAULT;
