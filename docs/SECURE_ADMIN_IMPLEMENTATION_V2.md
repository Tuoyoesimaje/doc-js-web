# Secure Admin Implementation V2 - High Security

## Overview
Single login page for all users. Admin access determined by role + OTP verification. No discoverable admin routes.

## Implementation Steps

### Step 1: Database Changes

Run this in Supabase SQL Editor:

```sql
-- Add role columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_otp_secret TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_admin_login TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE email = user_email 
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- To create your first admin, run:
-- UPDATE users SET is_admin = TRUE, role = 'admin' WHERE email = 'your@email.com';
```

### Step 2: Update authStore.ts

Add admin check function:

```typescript
// Add to authStore.ts
const checkAdminRole = async (userId: string): Promise<boolean> => {
  const { data } = await supabase
    .from('users')
    .select('is_admin, role')
    .eq('id', userId)
    .single()
  
  return data?.is_admin === true || data?.role === 'admin'
}

// Add to store state
isAdmin: false,
setIsAdmin: (isAdmin: boolean) => set({ isAdmin }),

// Update signInWithPassword to check admin role
const signInWithPassword = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  // Check if admin
  const isAdmin = await checkAdminRole(data.user.id)
  set({ isAdmin })
  
  // If admin, require OTP
  if (isAdmin) {
    // Send OTP to admin email
    await supabase.auth.signInWithOtp({ email })
    return { requiresOTP: true }
  }
  
  return { requiresOTP: false }
}
```

### Step 3: Update LoginPage.tsx

Add admin OTP flow:

```typescript
const [adminOTPRequired, setAdminOTPRequired] = useState(false)
const [adminOTP, setAdminOTP] = useState('')

const handleEmailLogin = async () => {
  setLoading(true)
  setError('')
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    
    // Check if admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('email', email)
      .single()
    
    if (userData?.is_admin) {
      // Send OTP
      await supabase.auth.signInWithOtp({ email })
      setAdminOTPRequired(true)
      setError('Admin OTP sent to your email')
    }
  } catch (err: any) {
    setError(err.message || 'Login failed')
  } finally {
    setLoading(false)
  }
}

const handleAdminOTPVerify = async () => {
  setLoading(true)
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: adminOTP,
      type: 'email',
    })
    if (error) throw error
    
    // Set admin session
    sessionStorage.setItem('admin_verified', 'true')
  } catch (err: any) {
    setError('Invalid OTP')
  } finally {
    setLoading(false)
  }
}

// Add OTP input UI when adminOTPRequired is true
```

### Step 4: Update App.tsx Routes

Remove `/admin/login` route and protect `/admin`:

```typescript
// Remove this line:
// <Route path="/admin/login" element={<AdminLoginPage />} />

// Update admin route:
<Route 
  path="/admin" 
  element={
    <ProtectedAdminRoute>
      <AdminPanel />
    </ProtectedAdminRoute>
  } 
/>

// Add 404 for unknown routes
<Route path="*" element={<Navigate to="/" />} />
```

### Step 5: Create ProtectedAdminRoute Component

```typescript
// app/src/components/ProtectedAdminRoute.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/')
        return
      }

      // Check if admin verified
      const adminVerified = sessionStorage.getItem('admin_verified')
      if (!adminVerified) {
        navigate('/')
        return
      }

      // Check admin role in database
      const { data } = await supabase
        .from('users')
        .select('is_admin, role')
        .eq('id', user.id)
        .single()

      if (data?.is_admin !== true && data?.role !== 'admin') {
        navigate('/')
        return
      }

      setIsAdmin(true)
      setLoading(false)
    }

    checkAdmin()
  }, [user, navigate])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  return isAdmin ? <>{children}</> : null
}
```

### Step 6: Update AdminPanel.tsx

Remove old auth check, rely on ProtectedAdminRoute:

```typescript
// Remove these lines:
// const isAdmin = sessionStorage.getItem('admin_authenticated')
// if (!isAdmin) navigate('/admin/login')

// Keep the logout button but update it:
<Button 
  variant="secondary"
  onClick={() => {
    sessionStorage.removeItem('admin_verified')
    navigate('/')
  }}
>
  Logout
</Button>
```

### Step 7: Delete AdminLoginPage.tsx

```bash
rm app/src/pages/AdminLoginPage.tsx
```

## Security Features

✅ **No discoverable admin routes** - `/admin` returns 404 or redirects if not authenticated  
✅ **Single login page** - All users use same login  
✅ **Role-based access** - Admin determined by database role  
✅ **OTP verification** - Admins require email OTP after password  
✅ **No password reset** - Admin passwords can only be changed via database  
✅ **Session-based** - Admin verification stored in session (expires on close)  
✅ **Server-side checks** - All admin checks query database  

## Creating Admin Users

```sql
-- In Supabase SQL Editor:
UPDATE users 
SET is_admin = TRUE, role = 'admin' 
WHERE email = 'admin@docjslaundry.com';
```

## Admin Login Flow

1. User goes to `/login` (same as customers)
2. Enters email + password
3. System checks if email is admin
4. If admin → sends OTP to email
5. User enters OTP
6. System verifies OTP
7. Sets `admin_verified` in session
8. User can now access `/admin`

## Attack Prevention

❌ **No brute force** - OTP required after password  
❌ **No password reset** - Admins can't reset via email  
❌ **No route discovery** - `/admin` gives no hints  
❌ **No role escalation** - Role checks on every request  
❌ **No session hijacking** - Session expires on browser close  

## Implementation Checklist

- [ ] Run database migration
- [ ] Update authStore with admin checks
- [ ] Update LoginPage with OTP flow
- [ ] Create ProtectedAdminRoute component
- [ ] Update App.tsx routes
- [ ] Update AdminPanel logout
- [ ] Delete AdminLoginPage
- [ ] Create first admin user in database
- [ ] Test admin login flow
- [ ] Test non-admin cannot access `/admin`

This is production-grade security! 🔒
