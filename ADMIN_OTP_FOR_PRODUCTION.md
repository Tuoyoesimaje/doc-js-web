# Admin OTP for Production (Future Enhancement)

## Current Setup (Development)
Admin users login with email + password, and `admin_verified` flag is set automatically. This works for development but you want OTP for production.

## How to Add OTP for Production

When you're ready to add OTP verification for admins in production, follow these steps:

### Step 1: Configure Email Provider

Supabase's default email has rate limits. For production, use a custom provider:

**Option A: Resend (Recommended)**
1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. In Supabase: Settings → Auth → Email Provider
4. Select "Resend" and add API key

**Option B: SendGrid**
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Get API key
3. In Supabase: Settings → Auth → Email Provider
4. Select "SendGrid" and add API key

### Step 2: Update LoginPage.tsx

Replace the `handleEmailLogin` function with this OTP-enabled version:

```typescript
const handleEmailLogin = async () => {
  setLoading(true)
  setError('')
  try {
    // Login first
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error

    // Check if user is admin
    if (data.user) {
      const { data: userData } = await supabase
        .from('users')
        .select('is_admin, role')
        .eq('id', data.user.id)
        .single()

      if (userData?.is_admin === true || userData?.role === 'admin') {
        // PRODUCTION: Require OTP for admins
        if (import.meta.env.PROD) {
          // Logout and require OTP
          await supabase.auth.signOut()
          
          // Send OTP
          await supabase.auth.signInWithOtp({ 
            email,
            options: {
              shouldCreateUser: false,
            }
          })
          
          setMode('admin-otp')
          setError('Admin verification required. OTP sent to your email.')
          setLoading(false)
          return
        }
        
        // DEVELOPMENT: Auto-verify
        sessionStorage.setItem('admin_verified', 'true')
        await supabase
          .from('users')
          .update({ last_admin_login: new Date().toISOString() })
          .eq('id', data.user.id)
      }
    }
    
    setLoading(false)
    
  } catch (err: any) {
    setError(err.message || 'Login failed')
    setLoading(false)
  }
}
```

### Step 3: Add Back Admin OTP Mode

Add this to the LoginPage modes:

```typescript
type LoginMode = 'phone' | 'google' | 'email' | 'otp-verify' | 'set-password' | 'admin-otp'
```

Add back the admin OTP state:

```typescript
const [adminOTP, setAdminOTP] = useState('')
```

Add back the admin OTP verify function:

```typescript
const handleAdminOTPVerify = async () => {
  setLoading(true)
  setError('')
  try {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: adminOTP,
      type: 'email',
    })
    if (error) throw error

    // Set admin verified in session
    sessionStorage.setItem('admin_verified', 'true')
    
    // Success - auth state will update automatically
  } catch (err: any) {
    setError('Invalid OTP. Please try again.')
  } finally {
    setLoading(false)
  }
}
```

Add back the admin OTP UI (after set-password mode):

```typescript
{mode === 'admin-otp' && (
  <div className="space-y-5">
    <div className="text-center mb-6">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 4C11.58 4 8 7.58 8 12v4H6v12h20V16h-2v-4c0-4.42-3.58-8-8-8z" stroke="#dc2626" strokeWidth="2.5" strokeLinejoin="round"/>
          <circle cx="16" cy="22" r="2" fill="#dc2626"/>
        </svg>
      </div>
      <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
        Admin Verification Required
      </h3>
      <p className="text-sm text-gray-600">
        Enter the 6-digit code sent to<br/>
        <span className="font-semibold text-gray-900">{email}</span>
      </p>
    </div>
    <Input
      type="text"
      placeholder="Enter 6-digit code"
      value={adminOTP}
      onChange={(e) => setAdminOTP(e.target.value)}
      maxLength={6}
      className="text-center text-2xl tracking-widest font-bold"
    />
    <Button onClick={handleAdminOTPVerify} loading={loading} fullWidth>
      Verify Admin Access
    </Button>
    <button
      onClick={() => {
        setMode('email')
        setAdminOTP('')
        setError('')
      }}
      className="w-full text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
    >
      ← Back to login
    </button>
  </div>
)}
```

### Step 4: Test in Production

1. Deploy to Vercel
2. Login as admin
3. Should receive OTP email
4. Enter OTP
5. Access admin panel

## Benefits of OTP in Production

✅ **Two-factor authentication** - Password + OTP  
✅ **Email verification** - Confirms admin email is valid  
✅ **Audit trail** - OTP requests logged by Supabase  
✅ **Rate limiting** - Supabase limits OTP requests  
✅ **Session security** - OTP expires after use  

## Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| Admin Login | Password only | Password + OTP |
| Email Provider | Supabase default | Custom (Resend/SendGrid) |
| Rate Limits | Low (testing) | High (production) |
| OTP Delivery | May be slow | Fast & reliable |

## When to Enable OTP

Enable OTP when:
- ✅ You have a custom email provider configured
- ✅ You're ready to go live
- ✅ You've tested OTP flow in staging
- ✅ You have backup admin accounts

## Rollback Plan

If OTP causes issues, you can quickly rollback by:

1. Remove the `if (import.meta.env.PROD)` check
2. Keep auto-verify for all environments
3. Redeploy

The code is already structured to make this easy!

---

**For now, password-only admin login is fine for development and testing. Add OTP when you're ready for production!** 🔒
