# Transactional Emails Implementation

## Overview
Automated emails for order lifecycle, admin messages, and customer notifications using Resend.

## Email Types to Implement

1. **Order Confirmation** - When order is created
2. **Payment Confirmation** - When payment succeeds
3. **Order Status Updates** - Processing, Ready, Delivered
4. **Admin Messages** - When admin replies in support chat
5. **Pickup/Delivery Reminders** - Day before pickup/delivery
6. **Payment Reminders** - For postpay orders

## Implementation Steps

### Step 1: Install Resend SDK

```bash
cd app
npm install resend
```

### Step 2: Create Resend API Route (Serverless Function)

We'll use Vercel serverless functions to send emails securely.

Create: `api/send-email.ts`

### Step 3: Add Resend API Key to Environment

In Vercel Dashboard → Environment Variables:
```
RESEND_API_KEY=re_your_api_key_here
```

### Step 4: Create Email Templates

We'll create beautiful HTML email templates for each type.

---

## Implementation Files

I'll create the necessary files now...
