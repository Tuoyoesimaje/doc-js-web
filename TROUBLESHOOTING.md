# Troubleshooting Guide

## Authentication Errors

### Error: "Unsupported provider: provider is not enabled"

**Cause**: The authentication provider (Google or Phone) is not enabled in Supabase.

**Solution**:

#### Enable Google OAuth:
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Find **Google** in the list
4. Toggle it **ON**
5. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project (or select existing)
   - Enable Google+ API
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Add authorized redirect URI: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Copy **Client ID** and **Client Secret**
   - Paste into Supabase Google provider settings
   - Click **Save**

#### Enable Phone Auth:
1. Go to **Authentication** → **Providers**
2. Find **Phone** in the list
3. Toggle it **ON**
4. Choose SMS provider (Twilio recommended)
5. For Twilio:
   - Sign up at [Twilio](https://www.twilio.com)
   - Get your **Account SID**, **Auth Token**, and **Phone Number**
   - Paste into Supabase Phone provider settings
   - Click **Save**

#### Quick Test (Email/Password as fallback):
If you want to test immediately without setting up Google/Phone:

1. Enable **Email** provider in Supabase (usually enabled by default)
2. Update `LoginPage.tsx` to use email/password temporarily
3. Test the flow
4. Then set up Google/Phone later

---

## Common Issues

### 1. "Failed to fetch" or Network Errors

**Symptoms**: 
- Login button does nothing
- Console shows CORS errors
- "Failed to fetch" errors

**Solutions**:
- Check `.env` file has correct Supabase URL and key
- Verify Supabase project is running (not paused)
- Check browser console for actual error
- Verify internet connection
- Check Supabase dashboard for service status

### 2. "Invalid API key" or "Unauthorized"

**Symptoms**:
- 401 Unauthorized errors
- "Invalid API key" messages

**Solutions**:
- Verify `VITE_SUPABASE_ANON_KEY` in `.env` is correct
- Copy from Supabase → Settings → API → `anon` `public` key
- Restart dev server after changing `.env`
- Don't use the `service_role` key in frontend!

### 3. RLS Policy Errors

**Symptoms**:
- "Row level security policy violation"
- 406 Not Acceptable errors
- Can't read/write data even when logged in

**Solutions**:
- Verify user is authenticated: `console.log(supabase.auth.getUser())`
- Check RLS policies in Supabase → Table Editor → Select table → RLS tab
- Ensure policies use `auth.uid()` correctly
- **Important**: Make sure users table has INSERT policy:
  ```sql
  CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);
  ```
- Test policies in SQL editor:
  ```sql
  -- Test as specific user
  SELECT * FROM orders WHERE user_id = 'user-uuid-here';
  ```

### 4. OTP Not Received

**Symptoms**:
- Phone OTP never arrives
- SMS not sent

**Solutions**:
- Check Twilio account has credits
- Verify phone number format: `+234XXXXXXXXXX` (with country code)
- Check Twilio logs for delivery status
- Verify Twilio phone number is SMS-enabled
- Check spam/blocked messages on phone
- Try different phone number

### 5. Build Errors

**Symptoms**:
- `npm run build` fails
- TypeScript errors
- Module not found errors

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build

# Fix unused variables
# Add underscore prefix: const _unusedVar = value

# Check imports are correct
# Verify file paths match exactly (case-sensitive)
```

### 6. Dev Server Won't Start

**Symptoms**:
- `npm run dev` fails
- Port already in use
- Vite errors

**Solutions**:
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3001

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### 7. Deployment Issues (Vercel)

**Symptoms**:
- Build fails on Vercel
- Environment variables not working
- 404 on routes

**Solutions**:
- Add all environment variables in Vercel dashboard
- Set build command: `npm run build`
- Set output directory: `dist`
- Set root directory: `app`
- Check build logs for specific errors
- Verify `vite.config.ts` has correct `base` path

### 8. Payment Errors (Phase 2)

**Symptoms**:
- Monnify modal doesn't open
- Payment not processing
- Webhook not received

**Solutions**:
- Verify Monnify credentials in `.env`
- Check Monnify dashboard for test/live mode
- Verify webhook URL is publicly accessible
- Check Edge Function logs in Supabase
- Test webhook with Postman first

---

## Quick Diagnostics

### Check Supabase Connection
```typescript
// Add to any component
useEffect(() => {
  const test = async () => {
    const { data, error } = await supabase.from('services').select('*').limit(1)
    console.log('Supabase test:', { data, error })
  }
  test()
}, [])
```

### Check Authentication State
```typescript
// Add to any component
useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Auth session:', session)
  }
  checkAuth()
}, [])
```

### Check Environment Variables
```typescript
// Add to any component
console.log('Env check:', {
  url: import.meta.env.VITE_SUPABASE_URL,
  hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
})
```

---

## Testing Checklist

Before reporting an issue, verify:

- [ ] `.env` file exists and has correct values
- [ ] Dev server restarted after `.env` changes
- [ ] Supabase project is active (not paused)
- [ ] Authentication providers are enabled
- [ ] Database schema is deployed
- [ ] RLS policies are enabled
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls
- [ ] Using correct Supabase URL (not example URL)
- [ ] Using `anon` key (not `service_role` key)

---

## Getting Help

1. **Check browser console** (F12 → Console tab)
2. **Check network tab** (F12 → Network tab)
3. **Check Supabase logs** (Dashboard → Logs)
4. **Check Vercel logs** (Dashboard → Deployments → View logs)
5. **Review this guide** for similar issues

### Useful Commands

```bash
# Check Node version (should be 18+)
node --version

# Check npm version
npm --version

# Clear all caches
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Run build to check for errors
npm run build

# Check TypeScript errors
npx tsc --noEmit

# Check for outdated packages
npm outdated
```

---

## Contact Support

If issue persists:
1. Describe the exact error message
2. Share browser console output
3. Share network tab (failed requests)
4. Share steps to reproduce
5. Share environment (OS, browser, Node version)
