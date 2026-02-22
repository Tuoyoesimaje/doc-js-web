# Doc JS Laundry - Current Status & Complete Roadmap

## WHAT WE HAVE NOW (COMPLETED)

### 1. Customer Portal (React App)
**Location**: `/app` folder

**Features Built**:
- ✅ Login/Signup (Email, Google OAuth, Phone OTP)
- ✅ Customer Dashboard with order stats
- ✅ Create New Order (Quick text input or Visual selection)
- ✅ Order Detail Page with animated tracking timeline
- ✅ Address Management (Add, Edit, Set Default)
- ✅ Profile Management (Update display name)
- ✅ Payment Integration (Monnify SDK loaded)
- ✅ Admin Panel (View all orders, update status)

**Design**:
- ✅ Premium modern design matching marketing site
- ✅ Sora font for headings, Inter for body
- ✅ Smooth animations with Framer Motion
- ✅ Gradient backgrounds, rounded corners
- ✅ Responsive layout

### 2. Database (Supabase)
**Schema Created**:
- ✅ users (customer profiles)
- ✅ addresses (delivery locations)
- ✅ services (laundry items with pricing)
- ✅ orders (customer orders)
- ✅ order_items (items in each order)
- ✅ order_events (status tracking)
- ✅ payments (payment records)
- ✅ uploads (file storage)

**Security**:
- ✅ Row Level Security (RLS) policies
- ✅ Auto-create user trigger on signup
- ✅ Users can only see their own data
- ✅ Admin role support

### 3. Services & Pricing (Seeded in Database)
**Current Services**:
- Shirt/Polo: ₦900
- Shirt Long Sleeve: ₦1,300
- Trousers/Jeans: ₦1,200
- Native (Senator/2pc): ₦2,200
- Agbada (3-Piece): ₦3,500
- Bedsheet (Double): ₦1,800
- Suit (2-Piece): ₦3,000
- Blazer/Jacket: ₦1,800
- Kaftan/Jalabiya: ₦2,500
- Evening Gown: ₦3,500
- Tie/Scarf: ₦500
- Wedding Gown: ₦12,000
- Duvet (Large): ₦4,000
- Rug Cleaning: ₦800/sqm
- Express Service: +50% surcharge

---

## WHAT'S NOT IMPLEMENTED YET

### 1. SMS Notifications ❌
**Status**: NOT IMPLEMENTED
**What's Needed**:
- Twilio account setup
- Edge function to send SMS
- Trigger SMS on order events

### 2. Email Notifications ❌
**Status**: NOT IMPLEMENTED
**What's Needed**:
- Email templates in Supabase
- Edge function to send emails
- Trigger emails on order events

### 3. Payment Webhooks ❌
**Status**: NOT IMPLEMENTED
**What's Needed**:
- Monnify webhook handler
- Edge function to process webhooks
- Auto-update order status on payment

### 4. Logistics/Delivery Options ❌
**Status**: NOT IMPLEMENTED (YOUR NEW REQUIREMENT)
**What's Needed**:
- Add logistics options to order flow
- Update database schema
- Add pricing logic

### 5. Marketing Website Integration ❌
**Status**: NOT IMPLEMENTED
**What's Needed**:
- Link marketing site to customer portal
- Add "Book Now" buttons
- Seamless navigation

---

## COMPLETE SETUP GUIDE

### STEP 1: Supabase Setup (Database)

**1.1 Create Supabase Project**
- Go to https://supabase.com
- Create new project
- Note your project URL and anon key

**1.2 Run Database Schema**
- Open Supabase Dashboard → SQL Editor
- Copy entire `supabase-schema.sql` file
- Run it to create all tables and policies

**1.3 Enable Authentication Providers**
- Go to Authentication → Providers
- Enable Email (already enabled by default)
- Enable Google OAuth (optional):
  - Get credentials from Google Cloud Console
  - Add redirect URL: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- Enable Phone (optional):
  - Choose SMS provider (Twilio recommended)
  - Add Twilio credentials

**1.4 Update Environment Variables**
- Copy `app/.env.example` to `app/.env`
- Add your Supabase URL and anon key:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

### STEP 2: Monnify Setup (Payments)

**2.1 Create Monnify Account**
- Go to https://monnify.com
- Sign up and complete KYC
- Get API credentials (test mode first)

**2.2 Add Monnify Credentials**
- Add to `app/.env`:
```env
VITE_MONNIFY_API_KEY=your_api_key
VITE_MONNIFY_CONTRACT_CODE=your_contract_code
```

**2.3 Test Payment Flow**
- Use Monnify test cards
- Card: 5061020000000000094
- CVV: 123, Expiry: 03/50, OTP: 123456

---

### STEP 3: SMS Notifications (Twilio)

**3.1 Create Twilio Account**
- Go to https://www.twilio.com
- Sign up and verify your account
- Get a phone number
- Note: Account SID, Auth Token, Phone Number

**3.2 Create Edge Function**
Create `supabase/functions/send-sms/index.ts`:

```typescript
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
  
  return new Response(JSON.stringify(await response.json()), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**3.3 Deploy Edge Function**
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Deploy
supabase functions deploy send-sms

# Set secrets
supabase secrets set TWILIO_ACCOUNT_SID=your_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_token
supabase secrets set TWILIO_PHONE_NUMBER=your_number
```

**3.4 SMS Triggers**
Send SMS on these events:
- Order created
- Payment confirmed
- Order processing
- Order ready for pickup
- Order delivered

---

### STEP 4: Email Notifications (Supabase)

**4.1 Configure Email Templates**
- Go to Supabase → Authentication → Email Templates
- Customize these templates:
  - Order Confirmation
  - Payment Received
  - Order Processing
  - Order Ready
  - Order Delivered

**4.2 Create Email Edge Function**
Create `supabase/functions/send-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { to, subject, html } = await req.json()
  
  // Use Supabase's built-in email or integrate SendGrid/Mailgun
  // For now, using Supabase's email service
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Send email logic here
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

### STEP 5: Payment Webhooks (Monnify)

**5.1 Create Webhook Handler**
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
  
  if (payload.eventType === 'SUCCESSFUL_TRANSACTION') {
    const reference = payload.transactionReference
    
    // Find payment by reference
    const { data: payment } = await supabase
      .from('payments')
      .select('*, order:orders(*, user:users(*))')
      .eq('provider_payload->reference', reference)
      .single()
    
    if (payment) {
      // Update payment status
      await supabase
        .from('payments')
        .update({ status: 'confirmed' })
        .eq('id', payment.id)
      
      // Update order status
      await supabase
        .from('orders')
        .update({ payment_status: 'confirmed' })
        .eq('id', payment.order_id)
      
      // Create event
      await supabase.from('order_events').insert({
        order_id: payment.order_id,
        event_type: 'payment_received',
        note: 'Payment confirmed',
      })
      
      // Send SMS
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          to: payment.order.user.phone,
          message: `Payment confirmed! Order #${payment.order_id.slice(0, 8).toUpperCase()}. We'll start processing your laundry soon.`,
        }),
      })
    }
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**5.2 Deploy Webhook**
```bash
supabase functions deploy monnify-webhook
```

**5.3 Configure Monnify**
- Go to Monnify Dashboard → Settings → Webhooks
- Add webhook URL: `https://YOUR_PROJECT.supabase.co/functions/v1/monnify-webhook`

---

### STEP 6: Add Logistics Options (NEW REQUIREMENT)

**6.1 Update Database Schema**
Add logistics options to orders table:

```sql
-- Add logistics columns to orders table
ALTER TABLE orders ADD COLUMN logistics_option TEXT CHECK (logistics_option IN ('none', 'pickup', 'pickup_delivery'));
ALTER TABLE orders ADD COLUMN logistics_fee_cents INTEGER DEFAULT 0;

-- Update existing orders
UPDATE orders SET logistics_option = 'none', logistics_fee_cents = 0 WHERE logistics_option IS NULL;
```

**6.2 Update Order Creation Flow**
In `NewOrderPage.tsx`, add logistics selection:
- Radio buttons for logistics options:
  - None (₦0) - Customer brings to shop
  - Pickup Only (₦2,000) - We pick up, customer collects
  - Pickup & Delivery (₦4,000) - Full service
- Add logistics fee to total calculation
- Save logistics option with order

**6.3 Update Admin Panel**
- Show logistics option on each order
- Highlight orders needing pickup
- Add pickup/delivery tracking

---

### STEP 7: Marketing Website Integration

**7.1 Current Marketing Site**
- Location: Root folder (`index.html`, `styles.css`, `script.js`)
- Already has design and branding

**7.2 Integration Steps**
1. Add "Book Now" / "Order Online" buttons to marketing site
2. Link to customer portal: `https://your-domain.com/app`
3. Add smooth navigation between sites
4. Ensure consistent branding

**7.3 Deployment Options**
- **Option A**: Deploy both on same domain
  - Marketing site: `https://docjs.com`
  - Customer portal: `https://docjs.com/app`
  
- **Option B**: Separate subdomains
  - Marketing site: `https://docjs.com`
  - Customer portal: `https://app.docjs.com`

---

## DEPLOYMENT GUIDE

### Option 1: Vercel (Recommended)

**Deploy Customer Portal**:
```bash
cd app
npm run build
# Deploy dist folder to Vercel
```

**Deploy Marketing Site**:
```bash
# Deploy root folder to Vercel
```

**Environment Variables in Vercel**:
- Add all variables from `.env`
- Set in Vercel Dashboard → Settings → Environment Variables

### Option 2: Netlify

Similar process to Vercel

### Option 3: Your Own Server

**Requirements**:
- Node.js 18+
- Nginx or Apache
- SSL certificate

---

## COST BREAKDOWN

### Per Order Costs:
- **Monnify**: 1.5% + ₦100 cap
- **SMS** (2-3 messages): ₦30-45
- **Email**: Free (Supabase)
- **Total**: ~₦130-145 + 1.5% of order value

### Monthly Costs (100 orders):
- **Supabase**: Free tier (up to 500MB database, 2GB bandwidth)
- **Monnify**: ~₦10,000 in fees
- **Twilio SMS**: ~₦3,000-4,500
- **Hosting** (Vercel/Netlify): Free tier
- **Total**: ~₦13,000-15,000/month

### Scaling (1000 orders/month):
- **Supabase**: ~$25/month (Pro plan)
- **Monnify**: ~₦100,000
- **Twilio**: ~₦30,000-45,000
- **Hosting**: ~$20/month
- **Total**: ~₦180,000-200,000/month

---

## IMMEDIATE NEXT STEPS

### Priority 1: Add Logistics Options
1. Update database schema (5 minutes)
2. Add logistics selection to NewOrderPage (30 minutes)
3. Update order calculation logic (15 minutes)
4. Update admin panel to show logistics (15 minutes)
5. Test end-to-end (15 minutes)

### Priority 2: Setup Notifications
1. Create Twilio account (10 minutes)
2. Deploy SMS edge function (20 minutes)
3. Test SMS sending (10 minutes)
4. Configure email templates (20 minutes)

### Priority 3: Setup Payment Webhooks
1. Deploy webhook edge function (15 minutes)
2. Configure Monnify webhook URL (5 minutes)
3. Test with test payment (10 minutes)

### Priority 4: Marketing Site Integration
1. Add "Book Now" buttons (15 minutes)
2. Link to customer portal (5 minutes)
3. Test navigation (10 minutes)

### Priority 5: Deploy Everything
1. Deploy customer portal to Vercel (20 minutes)
2. Deploy marketing site (15 minutes)
3. Configure custom domain (30 minutes)
4. Test production environment (30 minutes)

---

## TESTING CHECKLIST

Before going live:
- [ ] User can sign up and login
- [ ] User can add addresses
- [ ] User can create orders
- [ ] User can select logistics options
- [ ] Payment flow works end-to-end
- [ ] SMS notifications are sent
- [ ] Email notifications are sent
- [ ] Admin can view all orders
- [ ] Admin can update order status
- [ ] Webhooks update order status automatically
- [ ] Marketing site links to customer portal
- [ ] All pages are responsive
- [ ] All animations work smoothly

---

## SUPPORT & MAINTENANCE

### Regular Tasks:
- Monitor Supabase database size
- Check Twilio SMS credits
- Review Monnify transactions
- Update pricing as needed
- Backup database weekly

### Troubleshooting:
- Check Supabase logs for errors
- Check Edge Function logs
- Verify webhook deliveries in Monnify dashboard
- Test SMS delivery with Twilio logs

---

**SUMMARY**: You have a fully functional customer portal with premium design. What's missing is SMS/email notifications, payment webhooks, logistics options, and marketing site integration. All can be completed in 1-2 days of focused work.
