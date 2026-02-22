# Quick Start Guide - Test Immediately

## 🚀 Test the App Right Now (Without Full Setup)

You can test the app locally with email/password auth before setting up Google/Phone providers.

### Step 1: Create Supabase Project (5 minutes)

1. Go to https://supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `doc-js-laundry`
   - Database Password: (create a strong password)
   - Region: `Southeast Asia (Singapore)` or closest to Nigeria
4. Click "Create new project"
5. Wait ~2 minutes for provisioning

### Step 2: Deploy Database Schema (2 minutes)

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy entire contents of `supabase-schema.sql`
4. Paste into SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. Verify success message

**Important**: The schema includes an INSERT policy for the users table. If you already ran an older version, add this policy:

```sql
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
```

### Step 3: Get API Keys (1 minute)

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`

### Step 4: Configure Environment (1 minute)

1. Open `app/.env` file (create if doesn't exist)
2. Paste:
```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```
3. Replace with your actual values
4. Save file

### Step 5: Start Dev Server (30 seconds)

```bash
cd app
npm run dev
```

Visit: **http://localhost:3001/app/**

### Step 6: Test Email Login (2 minutes)

1. Click "Don't have an account? Sign up"
2. Enter:
   - Email: `test@example.com`
   - Password: `Test123456!`
3. Click "Sign In"
4. Check email for confirmation link (check spam)
5. Click confirmation link
6. Return to app and login

**OR** Disable email confirmation:

1. In Supabase: **Authentication** → **Settings**
2. Find "Enable email confirmations"
3. Toggle **OFF**
4. Now signup works immediately without email confirmation

### Step 7: Create Test Order

1. After login, you'll see dashboard
2. Click "New Order"
3. You'll see "No saved addresses" - that's expected
4. For now, you can test the order parser:
   - Switch to "Quick Input"
   - Type: `10 shirts, 5 trousers`
   - Click "Parse Items"
   - See items appear with prices!

---

## ✅ What Works Now

- ✅ Email/password authentication
- ✅ User registration
- ✅ Dashboard view
- ✅ Order creation UI
- ✅ Quick order parsing
- ✅ Visual order selection
- ✅ Price calculation
- ✅ Express service toggle

## ⏳ What Needs Setup

- ⏳ Google OAuth (requires Google Cloud setup)
- ⏳ Phone OTP (requires Twilio setup)
- ⏳ Address management (need to add addresses manually)
- ⏳ Payment processing (Phase 2)
- ⏳ Notifications (Phase 2)

---

## 🔧 Add Test Address (SQL)

To test full order flow, add a test address:

1. Go to Supabase → **SQL Editor**
2. Get your user ID first:
```sql
SELECT id, email FROM auth.users;
```
3. Copy your user ID
4. Insert test address:
```sql
INSERT INTO addresses (user_id, label, line1, city, state, is_default)
VALUES (
  'YOUR_USER_ID_HERE',
  'Home',
  '123 Test Street',
  'Lagos',
  'Lagos',
  true
);
```
5. Refresh app and create order again

---

## 🎯 Full Test Flow

1. **Signup**: Create account with email/password
2. **Login**: Sign in with credentials
3. **Add Address**: Use SQL above to add test address
4. **Create Order**:
   - Click "New Order"
   - Select address
   - Quick input: "10 shirts, 5 trousers"
   - Click "Parse Items"
   - Toggle "Express Service"
   - See total: ₦22,500 (₦15,000 + 50%)
   - Click "Continue to Payment"
5. **View Order**:
   - See order in dashboard
   - Click order card
   - See order details
   - See status timeline

---

## 🐛 Troubleshooting

### "Failed to fetch"
- Check `.env` has correct Supabase URL and key
- Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### "Invalid API key"
- Verify you copied the `anon` `public` key (not `service_role`)
- Check for extra spaces in `.env` file

### "Email not confirmed"
- Disable email confirmation in Supabase settings
- Or check spam folder for confirmation email

### Can't create order (no address)
- Add test address using SQL above
- Or wait for address management UI (coming soon)

### Prices showing as ₦0
- Verify services were seeded (check SQL ran successfully)
- Go to Supabase → **Table Editor** → **services** → verify 15 rows

---

## 📱 Test on Mobile

1. Find your local IP:
```bash
# Windows
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

2. Start dev server with host flag:
```bash
npm run dev -- --host
```

3. On phone, visit: `http://YOUR_IP:3001/app/`

---

## ⚡ Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for errors
npm run build

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## 🎉 Success Checklist

- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Dev server running
- [ ] Can signup with email
- [ ] Can login
- [ ] Can see dashboard
- [ ] Can parse order items
- [ ] Prices calculate correctly
- [ ] Can toggle express service

---

## 📞 Next Steps

Once basic testing works:

1. **Enable Google OAuth** (see SETUP_GUIDE.md)
2. **Enable Phone Auth** (see SETUP_GUIDE.md)
3. **Add Address Management UI** (coming soon)
4. **Deploy to Vercel** (see SETUP_GUIDE.md)
5. **Integrate Payments** (Phase 2)

---

## 💡 Tips

- Use Chrome DevTools (F12) to see console logs
- Check Network tab for API calls
- Use Supabase dashboard to view data
- Test in incognito mode to verify session handling
- Keep Supabase dashboard open to monitor logs

---

**Estimated Time**: 10-15 minutes to get fully working locally!

**Current Status**: ✅ Ready to test with email auth  
**Dev Server**: http://localhost:3001/app/
