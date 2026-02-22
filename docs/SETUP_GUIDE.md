# Doc JS Laundry - Complete Setup Guide

This guide walks you through setting up the entire system from scratch.

## Overview

- **Marketing Site**: Existing HTML/CSS/JS (stays as-is)
- **App Section**: New React app at `/app` route
- **Backend**: Supabase (managed)
- **Payment**: Monnify
- **Hosting**: Vercel

## Phase 1: Database Setup (Supabase)

### 1.1 Create Supabase Project

1. Go to https://supabase.com
2. Click "New Project"
3. Choose organization and region (Lagos recommended for Nigeria)
4. Set database password (save this!)
5. Wait for project to provision (~2 minutes)

### 1.2 Run Database Schema

1. Open SQL Editor in Supabase dashboard
2. Copy contents of `supabase-schema.sql`
3. Paste and run
4. Verify tables created in Table Editor

### 1.3 Configure Authentication

**Enable Google OAuth:**
1. Go to Authentication > Providers
2. Enable Google
3. Add OAuth credentials from Google Cloud Console
4. Set redirect URL: `https://your-project.supabase.co/auth/v1/callback`

**Enable Phone Auth:**
1. Go to Authentication > Providers
2. Enable Phone
3. Choose SMS provider (Twilio recommended)
4. Add Twilio credentials:
   - Account SID
   - Auth Token
   - Phone Number

### 1.4 Get API Keys

1. Go to Settings > API
2. Copy:
   - Project URL
   - `anon` public key
3. Save these for `.env` file

## Phase 2: React App Setup

### 2.1 Install Dependencies

```bash
cd app
npm install
```

### 2.2 Configure Environment

Create `app/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_MONNIFY_API_KEY=your_monnify_key
VITE_MONNIFY_CONTRACT_CODE=your_contract_code
```

### 2.3 Test Locally

```bash
npm run dev
```

Visit `http://localhost:3000` and test:
- Login with Google
- Login with phone (will need real phone for OTP)
- Create test order
- View dashboard

## Phase 3: Deployment (Vercel)

### 3.1 Prepare for Deployment

1. Commit all changes to Git
2. Push to GitHub

### 3.2 Deploy to Vercel

**Option A: Vercel CLI**
```bash
npm install -g vercel
cd app
vercel
```

**Option B: Vercel Dashboard**
1. Go to https://vercel.com
2. Click "New Project"
3. Import from GitHub
4. Set root directory: `app`
5. Add environment variables
6. Deploy

### 3.3 Configure Domain

**For subdirectory (docjslaundry.com/app):**
1. In Vercel, go to Settings > Domains
2. Add domain: `docjslaundry.com`
3. Configure DNS:
   - Type: A
   - Name: @
   - Value: 76.76.21.21

**For subdomain (app.docjslaundry.com):**
1. Add domain: `app.docjslaundry.com`
2. Configure DNS:
   - Type: CNAME
   - Name: app
   - Value: cname.vercel-dns.com

### 3.4 Update Supabase Redirect URLs

1. Go to Supabase > Authentication > URL Configuration
2. Add Site URL: `https://docjslaundry.com/app`
3. Add Redirect URLs:
   - `https://docjslaundry.com/app/**`
   - `http://localhost:3000/**` (for development)

## Phase 4: Testing

### 4.1 Test Authentication

**Google Login:**
1. Click "Continue with Google"
2. Select Google account
3. Should redirect to dashboard
4. Verify user created in Supabase > Authentication

**Phone Login (First Time):**
1. Enter phone number (with country code)
2. Click "Continue with Phone"
3. Receive OTP via SMS
4. Enter OTP
5. Set password
6. Should redirect to dashboard

**Phone Login (Returning):**
1. Enter phone + password
2. Should login without OTP

### 4.2 Test Order Flow

1. Login
2. Click "New Order"
3. Add address (if none exists)
4. Try Quick Input: "10 shirts, 5 trousers"
5. Click "Parse Items"
6. Verify items appear with correct prices
7. Toggle Express Service
8. Verify total updates (+50%)
9. Click "Continue to Payment"
10. Verify order created in Supabase

### 4.3 Test Admin Panel

1. Set admin role in Supabase:
   ```sql
   UPDATE auth.users 
   SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
   WHERE email = 'your-admin-email@example.com';
   ```
2. Navigate to `/admin`
3. View all orders
4. Update order status
5. Verify status change reflected

## Phase 5: Monnify Integration (Next)

### 5.1 Get Monnify Credentials

1. Sign up at https://monnify.com
2. Complete KYC verification
3. Get API credentials:
   - API Key
   - Secret Key
   - Contract Code

### 5.2 Create Supabase Edge Function

Create `supabase/functions/monnify-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const payload = await req.json()
  
  // Verify webhook signature
  // Update payment status
  // Update order status
  // Send notifications
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 5.3 Deploy Edge Function

```bash
supabase functions deploy monnify-webhook
```

### 5.4 Configure Monnify Webhook

1. Go to Monnify dashboard
2. Settings > Webhooks
3. Add webhook URL: `https://your-project.supabase.co/functions/v1/monnify-webhook`

## Phase 6: Notifications

### 6.1 SMS (Twilio)

Already configured in Supabase for OTP. Use same credentials for order notifications.

Create Edge Function for SMS:

```typescript
// supabase/functions/send-sms/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { to, message } = await req.json()
  
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message,
      }),
    }
  )
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 6.2 Email (Supabase)

Supabase includes email by default. Configure templates:

1. Go to Authentication > Email Templates
2. Customize templates for:
   - Order confirmation
   - Order processing
   - Order ready
   - Order delivered

## Acceptance Criteria Checklist

### Database
- [ ] All tables created successfully
- [ ] RLS policies working (users can't see others' data)
- [ ] Services seeded with correct pricing
- [ ] Indexes created for performance

### Authentication
- [ ] Google login works
- [ ] Phone OTP sent successfully
- [ ] Password set after first OTP
- [ ] Returning users login with password (no OTP)
- [ ] Session persists for 30 days

### Orders
- [ ] Quick text parsing works ("10 shirts, 5 trousers")
- [ ] Visual selection works
- [ ] Express service adds 50% surcharge
- [ ] Order total calculates correctly
- [ ] Order created in database
- [ ] Order appears in dashboard

### Tracking
- [ ] Order status timeline displays correctly
- [ ] Status updates reflect immediately
- [ ] Order events logged

### Admin
- [ ] Admin can view all orders
- [ ] Admin can update order status
- [ ] Status changes trigger notifications

### Deployment
- [ ] App deployed to Vercel
- [ ] Custom domain configured
- [ ] Environment variables set
- [ ] HTTPS working
- [ ] No console errors

## Troubleshooting

### "Failed to fetch" errors
- Check Supabase URL and keys
- Verify CORS settings in Supabase
- Check network tab for actual error

### OTP not received
- Verify Twilio credentials
- Check Twilio logs
- Ensure phone number format is correct (+234...)

### RLS policy errors
- Check user is authenticated
- Verify JWT token includes user_id
- Test policies in SQL editor

### Build fails on Vercel
- Check TypeScript errors locally first
- Verify all dependencies in package.json
- Check build logs for specific error

## Next Steps

After Phase 1-3 are working:

1. **Payments**: Integrate Monnify payment flow
2. **Notifications**: Set up SMS/Email triggers
3. **Advanced Parsing**: Add Claude API for natural language
4. **Templates**: Save frequent orders as templates
5. **Subscriptions**: Weekly/monthly pickup plans
6. **Barcode**: Generate tracking codes
7. **Rating**: Post-delivery feedback

## Support

For issues:
1. Check Supabase logs
2. Check Vercel deployment logs
3. Check browser console
4. Review this guide

Contact: [your-email@example.com]
