-- ============================================
-- IMMEDIATE FIX: Create Missing User Records
-- ============================================
-- Run this RIGHT NOW in Supabase SQL Editor to fix your current user

-- Step 1: Create missing user records for all auth users
INSERT INTO public.users (id, email, phone, display_name, password_set, google_provider_id, created_at, last_login)
SELECT 
  au.id,
  au.email,
  au.phone,
  COALESCE(
    au.raw_user_meta_data->>'full_name', 
    au.email, 
    au.phone, 
    'User'
  ) as display_name,
  CASE WHEN au.email IS NOT NULL THEN TRUE ELSE FALSE END as password_set,
  CASE 
    WHEN au.raw_app_meta_data->>'provider' = 'google' THEN au.id 
    ELSE NULL 
  END as google_provider_id,
  COALESCE(au.created_at, NOW()) as created_at,
  COALESCE(au.last_sign_in_at, NOW()) as last_login
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Step 2: Verify the fix
SELECT 
  au.id,
  au.email,
  au.phone,
  u.id as user_record_exists
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id;

-- Step 3: Add the trigger for future users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, display_name, password_set, google_provider_id, created_at, last_login)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.phone, 'User'),
    CASE WHEN NEW.email IS NOT NULL THEN TRUE ELSE FALSE END,
    CASE WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN NEW.id ELSE NULL END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DONE! Now refresh your app and try adding an address
-- ============================================
