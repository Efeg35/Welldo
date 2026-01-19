-- Redefine the function with better error handling for Enum casting
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_role public.user_role := 'member';
  role_str text;
BEGIN
  -- Get role as string from metadata
  role_str := NEW.raw_user_meta_data->>'role';

  -- Attempt to cast to user_role, default to 'member' if invalid or null
  IF role_str IS NOT NULL THEN
    BEGIN
      new_role := role_str::public.user_role;
    EXCEPTION WHEN OTHERS THEN
      new_role := 'member';
    END;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    new_role
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile somehow exists

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists (just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
