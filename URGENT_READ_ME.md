# [URGENT] Fix Address Creation Error

## The Problem You're Seeing

```
POST /rest/v1/addresses 409 (Conflict)
Key is not present in table "users"
```

## Why This Happens

When you signed up, Supabase created your account in the `auth.users` table, but your app also needs a record in the custom `users` table. Without it, you can't create addresses, orders, or anything else.

## The Fix (2 Options)

### Option 1: Run SQL (Recommended - Fixes Everything)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste This SQL:**

```sql
-- Fix existing users
INSERT INTO public.users (id, email, phone, display_name, password_set, google_provider_id, created_at, last_login)
SELECT 
  au.id,
  au.email,
  au.phone,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, au.phone, 'User'),
  CASE WHEN au.email IS NOT NULL THEN TRUE ELSE FALSE END,
  CASE WHEN au.raw_app_meta_data->>'provider' = 'google' THEN au.id ELSE NULL END,
  COALESCE(au.created_at, NOW()),
  COALESCE(au.last_sign_in_at, NOW())
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Add trigger for future users
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

4. **Click "Run"**

5. **Refresh Your App**
   - Press Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Or close and reopen the browser tab

6. **Try Adding an Address Again** - It will work!

---

### Option 2: Sign Up with New Account (Quick Test)

If you just want to test quickly:

1. **Sign out** of the app
2. **Sign up** with a different email/phone
3. The updated code will automatically create the user record
4. **Try adding an address** - should work now

---

## What I Fixed in the Code

### 1. Database Trigger (in SQL above)
- Automatically creates user records when someone signs up
- Runs at database level, so it's bulletproof
- Uses `SECURITY DEFINER` to bypass RLS restrictions

### 2. Frontend Fallback (already updated)
- `AddAddressModal.tsx` now checks if user record exists
- Creates it automatically if missing
- Adds retry logic for timing issues

### 3. Auth Store (already updated)
- Better error handling
- Retry logic for user creation
- Waits for database operations to complete

---

## Verify It's Fixed

After running the SQL:

1. Open browser console (F12)
2. Try to add an address
3. Should see no errors
4. Address should be created successfully

---

## Why This Happened

Your app has two user tables:
- `auth.users` - Managed by Supabase Auth (automatic)
- `users` - Your custom table with extra fields (needs manual creation)

The trigger I added bridges these two tables automatically.

---

## Next Steps After Fix

Once addresses work:
1. Create your first order
2. Test payment flow
3. Move to Phase 3 features

---

## Still Having Issues?

If the error persists after running the SQL:

1. **Check if SQL ran successfully:**
   - Go to Supabase → SQL Editor
   - Run: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
   - Should return 1 row

2. **Check if your user exists:**
   - Run: `SELECT * FROM public.users;`
   - Should see your user record

3. **Try signing out and back in:**
   - Sometimes the session needs to refresh

4. **Check browser console:**
   - Look for any new error messages
   - Share them if you need more help

---

## Files to Reference

- `FIX_CURRENT_USER.sql` - Complete SQL fix
- `USER_CREATION_FIX.md` - Detailed explanation
- `TROUBLESHOOTING.md` - Updated with this issue
- `supabase-schema.sql` - Full schema with trigger

---

**This is a one-time fix.** Once you run the SQL, all future users will be created automatically and you'll never see this error again.
