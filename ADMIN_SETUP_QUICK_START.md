# Admin Security - Quick Start Guide

## 🚀 3-Step Setup

### Step 1: Run Database Migration (2 minutes)

1. Open your Supabase project
2. Go to **SQL Editor**
3. Copy the entire contents of `ADD_SUPPORT_CHAT_MIGRATION.sql`
4. Paste and click **Run**
5. Wait for "Success" message

### Step 2: Create Your Admin Account (30 seconds)

In Supabase SQL Editor, run this command:

```sql
UPDATE users 
SET is_admin = TRUE, role = 'admin' 
WHERE email = 'YOUR_EMAIL_HERE@example.com';
```

**Important:** Replace `YOUR_EMAIL_HERE@example.com` with your actual email address!

### Step 3: Test Admin Login (1 minute)

1. Go to your app: `/login`
2. Enter your email + password
3. You'll see: **"Admin verification required. OTP sent to your email."**
4. Check your email for 6-digit code
5. Enter the code
6. Navigate to `/admin` - you're in! 🎉

---

## ✅ What You Get

### Security Features
- ✅ No discoverable admin routes
- ✅ Single login page for everyone
- ✅ Role-based access control
- ✅ OTP verification for admins
- ✅ No password reset for admins
- ✅ Session-based security

### Admin Flow
```
Login → Password → OTP Email → Enter Code → Admin Access
```

### Customer Flow
```
Login → Password → Dashboard (no OTP needed)
```

---

## 🔒 How It Works

### For Regular Users
- Login with email/password → Dashboard
- Cannot access `/admin` (redirected to homepage)
- No hints that admin panel exists

### For Admin Users
- Login with email/password → OTP sent to email
- Enter 6-digit OTP → Verified
- Can access `/admin` panel
- Session expires when browser closes

---

## 🧪 Testing

### Test 1: Admin Access
1. Login with admin email
2. Enter OTP from email
3. Go to `/admin` → Should work ✅

### Test 2: Non-Admin Blocked
1. Login with regular user
2. Try to go to `/admin` → Redirected to homepage ✅
3. No error messages shown ✅

### Test 3: Session Expiry
1. Login as admin
2. Close browser
3. Open browser and go to `/admin` → Redirected ✅
4. Must login + OTP again ✅

---

## 🆘 Troubleshooting

### "OTP not received"
- Check spam folder
- Verify email in Supabase Auth settings
- Wait 1-2 minutes (email can be slow)

### "Can't access /admin"
- Verify you ran the database migration
- Check `is_admin = TRUE` in database
- Try logging out and back in
- Clear browser cache

### "Still shows old admin login page"
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check that `AdminLoginPage.tsx` was deleted

---

## 📝 Creating More Admins

To add another admin user:

```sql
UPDATE users 
SET is_admin = TRUE, role = 'admin' 
WHERE email = 'another_admin@example.com';
```

---

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `ADD_SUPPORT_CHAT_MIGRATION.sql` | Database setup |
| `app/src/components/ProtectedAdminRoute.tsx` | Route protection |
| `app/src/pages/LoginPage.tsx` | Admin OTP flow |
| `app/src/pages/AdminPanel.tsx` | Admin dashboard |
| `app/src/App.tsx` | Route configuration |

---

## ⚠️ Important Notes

1. **Admin passwords cannot be reset via email** - This is a security feature. To reset an admin password, update it directly in the database.

2. **OTP expires after 60 seconds** - If OTP doesn't work, request a new one by logging in again.

3. **Session expires on browser close** - Admins must re-verify OTP each session for security.

4. **Keep at least 2 admin accounts** - In case one gets locked out.

---

## 🎉 You're Done!

Your admin panel now has production-grade security:
- No discoverable routes
- Role-based access
- OTP verification
- Session security

For detailed documentation, see `ADMIN_SECURITY_COMPLETE.md`
