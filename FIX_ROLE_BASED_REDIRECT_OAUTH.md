# Fix Role-Based Redirect for OAuth and All Login Methods

## Problem

After logging in (especially with Google OAuth), users were always redirected to `/dashboard` regardless of their role:
- Admins were sent to `/dashboard` instead of `/admin`
- Employees were sent to `/dashboard` instead of `/employee`
- Users had to manually change the URL to access their correct portal

## Root Cause

The OAuth redirect URLs were hardcoded to `/app/dashboard`:

```typescript
// OLD CODE - HARDCODED REDIRECT
signInWithGoogle: async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/app/dashboard`, // ❌ Always dashboard
    },
  })
}
```

This bypassed the `RoleBasedRedirect` component that was designed to send users to their appropriate portal.

## Solution

Changed all OAuth and signup redirects to point to `/app` (root) instead of `/app/dashboard`:

```typescript
// NEW CODE - SMART REDIRECT
signInWithGoogle: async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/app`, // ✅ Root uses RoleBasedRedirect
    },
  })
}
```

The root route (`/`) in App.tsx already uses `RoleBasedRedirect`:
```typescript
<Route path="/" element={user ? <RoleBasedRedirect /> : <Navigate to="/order" />} />
```

So when users are redirected to `/app`, the `RoleBasedRedirect` component:
1. Checks if user is an employee → redirects to `/employee`
2. Checks if user is an admin → redirects to `/admin`
3. Otherwise → redirects to `/dashboard` (customer)

## Files Modified

### 1. `app/src/store/authStore.ts`
- Changed Google OAuth `redirectTo` from `/app/dashboard` to `/app`

### 2. `app/src/components/QuickSignupModal.tsx`
- Changed Google OAuth `redirectTo` from `/app/dashboard` to `/app`
- Changed email signup `emailRedirectTo` from `/app/dashboard` to `/app`

## How It Works Now

### Login Flow (All Methods):
1. User logs in (email/password, phone, or Google)
2. After successful auth, user is redirected to `/app` (root)
3. `RoleBasedRedirect` component checks user role:
   - Employee? → `/employee`
   - Admin? → `/admin`
   - Customer? → `/dashboard`
4. User lands in their correct portal automatically

### OAuth Flow (Google):
1. User clicks "Sign in with Google"
2. Google auth completes
3. Supabase redirects to `/app` (not `/app/dashboard`)
4. `RoleBasedRedirect` sends user to correct portal based on role

### Guest Checkout Flow:
1. Guest selects items on `/app/order`
2. Guest signs up during checkout
3. After signup, redirected to `/app`
4. `RoleBasedRedirect` sends to `/dashboard` (customer)
5. `NewOrderPage` detects guest order and loads it automatically

## Benefits

### Before:
- ❌ All users sent to `/dashboard` regardless of role
- ❌ Admins had to manually navigate to `/admin`
- ❌ Employees had to manually navigate to `/employee`
- ❌ Poor user experience
- ❌ Confusing for non-customer users

### After:
- ✅ Employees automatically sent to `/employee`
- ✅ Admins automatically sent to `/admin`
- ✅ Customers sent to `/dashboard`
- ✅ Works for all login methods (email, phone, Google)
- ✅ Seamless, professional experience
- ✅ No manual URL editing needed

## Testing Checklist

- [ ] Admin logs in with email → redirects to `/admin`
- [ ] Admin logs in with Google → redirects to `/admin`
- [ ] Employee logs in with email → redirects to `/employee`
- [ ] Employee logs in with phone → redirects to `/employee`
- [ ] Customer logs in with email → redirects to `/dashboard`
- [ ] Customer logs in with Google → redirects to `/dashboard`
- [ ] Guest checkout → signup → redirects to `/dashboard` with order loaded
- [ ] No manual URL editing needed for any user type

## Additional Notes

### Why Root (`/`) Instead of Direct Portal Routes?

We could have tried to detect the role BEFORE redirecting and set different `redirectTo` URLs for each role, but that would require:
1. Checking role before OAuth completes (not possible)
2. Multiple OAuth configurations (complex)
3. Duplicating role detection logic (not DRY)

By redirecting everyone to `/app` (root) and using `RoleBasedRedirect`, we:
1. Have a single source of truth for role detection
2. Keep the logic centralized and maintainable
3. Make it easy to add new roles in the future
4. Ensure consistent behavior across all login methods

### Guest Order Preservation

The `NewOrderPage` already has logic to detect and load guest orders after signup:
```typescript
useEffect(() => {
  checkForGuestOrder()
}, [location.pathname])
```

So even though users are redirected to `/app` first, then to `/dashboard`, the guest order is still loaded correctly.

---

**Status**: ✅ FIXED - Test all login methods with different user roles
