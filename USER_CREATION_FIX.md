# User Creation Fix - CRITICAL

## The Problem

You're seeing this error:
```
insert or update on table "addresses" violates foreign key constraint "addresses_user_id_fkey"
Key is not present in table "users"
```

**Root Cause**: When users sign up with Supabase Auth, they're created in `auth.users` table, but NOT in your custom `users` table. Without a record in `users` table, they can't create addresses (foreign key constraint).

## The Solution

I've implemented a **database trigger** that automatically creates a user record in the `users` table whenever someone signs up. This is the cleanest and most reliable solution.

## What You Need to Do

### Step 1: Update Your Database

1. Open **Supabase Dashboard** → **SQL Editor**
2. Copy the **entire** `supabase-schema.sql` file
3. Paste and run it

**OR** if you want to just add the trigger (safer for existing data):

```sql
-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, display_name, password_set, google_provider_id, created_at, last_login)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.phone),
    CASE WHEN NEW.email IS NOT NULL THEN TRUE ELSE FALSE END,
    CASE WHEN NEW.raw_app_meta_data->>'provider' = 'google' THEN NEW.id ELSE NULL END,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Step 2: Fix Existing Users (If Any)

If you already have users in `auth.users` who don't have records in `users` table:

```sql
-- Create missing user records
INSERT INTO public.users (id, email, phone, display_name, password_set, google_provider_id, created_at, last_login)
SELECT 
  au.id,
  au.email,
  au.phone,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email, au.phone, 'User'),
  CASE WHEN au.email IS NOT NULL THEN TRUE ELSE FALSE END,
  CASE WHEN au.raw_app_meta_data->>'provider' = 'google' THEN au.id ELSE NULL END,
  au.created_at,
  au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;
```

### Step 3: Test

1. **Sign out** of the app
2. **Sign up** with a new account (email or phone)
3. Try to **add an address**
4. Should work now! ✅

## What Changed

### Database (`supabase-schema.sql`)
- Added `handle_new_user()` trigger function
- Trigger runs automatically on every signup
- Uses `SECURITY DEFINER` to bypass RLS
- Uses `ON CONFLICT DO NOTHING` to prevent duplicates

### Frontend (`app/src/store/authStore.ts`)
- Added retry logic if user record doesn't exist immediately
- Waits 1-1.5 seconds for trigger to complete
- Falls back to manual insert if trigger fails
- Better error handling

## Why This Works

1. **Automatic**: No manual user creation needed
2. **Reliable**: Runs at database level, can't be skipped
3. **Secure**: Uses `SECURITY DEFINER` to bypass RLS
4. **Safe**: `ON CONFLICT DO NOTHING` prevents duplicates
5. **Fast**: Happens instantly on signup

## Testing Checklist

After applying the fix:

- [ ] Sign up with email → user record created
- [ ] Sign up with Google → user record created
- [ ] Sign up with phone → user record created
- [ ] Add address → works without errors
- [ ] Create order → works without errors
- [ ] No more 403 or 409 errors

## Troubleshooting

### If you still see errors:

1. **Check if trigger exists**:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

2. **Check if function exists**:
```sql
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
```

3. **Manually create user record** (replace with your user ID):
```sql
INSERT INTO public.users (id, email, phone, display_name, password_set)
SELECT id, email, phone, COALESCE(email, phone, 'User'), true
FROM auth.users
WHERE id = 'your-user-id-here'
ON CONFLICT (id) DO NOTHING;
```

4. **Check RLS policies**:
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## Next Steps

Once this is fixed:
1. Add addresses will work
2. Create orders will work
3. All foreign key constraints will be satisfied
4. Ready to move to Phase 3!

---

**This is a critical fix** - apply it before continuing with any other features!
