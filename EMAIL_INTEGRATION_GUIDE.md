# Email Integration Guide

## ✅ What's Been Created

1. **API Route:** `api/send-email.ts` - Serverless function to send emails
2. **Email Helper:** `app/src/lib/email.ts` - Easy-to-use functions
3. **6 Email Types:** Order confirmation, payment, status updates, admin messages, order ready, payment reminders

## 🚀 Setup Steps

### Step 1: Install Resend Package

```bash
cd app
npm install resend
```

### Step 2: Add Resend API Key to Vercel

1. Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**
2. Add:
   ```
   RESEND_API_KEY=re_your_api_key_here
   ```
3. Redeploy

### Step 3: Integrate Emails into Your App

Now you can send emails from anywhere in your app!

---

## 📧 Email Integration Examples

### 1. Order Confirmation (NewOrderPage.tsx)

After creating an order, send confirmation email:

```typescript
import { sendOrderConfirmationEmail } from '../lib/email'

// After order is created successfully
await sendOrderConfirmationEmail({
  customerEmail: user.email!,
  customerName: user.display_name,
  orderId: newOrder.id,
  items: selectedItems.map(item => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price_cents * item.quantity,
  })),
  total: totalCents,
  logisticsOption,
  logisticsFee: logisticsFee * 100,
  paymentMethod,
})
```

### 2. Payment Confirmation (PaymentModal.tsx)

After successful payment:

```typescript
import { sendPaymentConfirmationEmail } from '../lib/email'

// After payment succeeds
await sendPaymentConfirmationEmail({
  customerEmail: user.email!,
  customerName: user.display_name,
  orderId: order.id,
  amount: amountPaid,
  paymentMethod: 'Monnify',
  transactionId: paymentReference,
})
```

### 3. Order Status Updates (AdminPanel.tsx)

When admin updates order status:

```typescript
import { sendOrderStatusEmail, sendOrderReadyEmail } from '../lib/email'

const updateOrderStatus = async (orderId: string, newStatus: string) => {
  // Update in database
  await supabase
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)

  // Get order details
  const { data: order } = await supabase
    .from('orders')
    .select('*, user:users(*)')
    .eq('id', orderId)
    .single()

  // Send email based on status
  if (newStatus === 'ready') {
    await sendOrderReadyEmail({
      customerEmail: order.user.email,
      customerName: order.user.display_name,
      orderId: order.id,
      finalPaymentPending: order.final_payment_pending,
      remainingAmount: order.total_cents - (order.pickup_fee_paid ? 200000 : 0),
    })
  } else if (['processing', 'delivered'].includes(newStatus)) {
    await sendOrderStatusEmail({
      customerEmail: order.user.email,
      customerName: order.user.display_name,
      orderId: order.id,
      status: newStatus as any,
    })
  }
}
```

### 4. Admin Messages (SupportChat.tsx)

When admin sends a message:

```typescript
import { sendAdminMessageEmail } from '../lib/email'

// After admin sends message
if (isAdmin) {
  await sendAdminMessageEmail({
    customerEmail: customerEmail,
    customerName: customerName,
    message: messageText,
  })
}
```

### 5. Payment Reminders (Automated)

You can create a cron job or manual trigger:

```typescript
import { sendPaymentReminderEmail } from '../lib/email'

// Find orders with pending payments
const { data: orders } = await supabase
  .from('orders')
  .select('*, user:users(*)')
  .eq('final_payment_pending', true)
  .eq('status', 'ready')

// Send reminders
for (const order of orders) {
  await sendPaymentReminderEmail({
    customerEmail: order.user.email,
    customerName: order.user.display_name,
    orderId: order.id,
    amount: order.total_cents - 200000, // Remaining amount
  })
}
```

---

## 🎨 Email Templates

All emails include:
- ✅ Professional design with Doc JS Laundry branding
- ✅ Responsive (mobile-friendly)
- ✅ Clear call-to-action buttons
- ✅ Order tracking links
- ✅ Company contact information

### Email Types:

1. **Order Confirmation** 🎉
   - Sent when order is created
   - Shows order details, items, total
   - Link to track order

2. **Payment Confirmation** ✅
   - Sent after successful payment
   - Shows receipt with transaction ID
   - Link to view order

3. **Order Status Updates** 📦
   - Processing: "Being cleaned"
   - Ready: "Ready for pickup"
   - Delivered: "Delivered successfully"

4. **Admin Messages** 💬
   - Sent when admin replies in support chat
   - Shows message content
   - Link to reply in app

5. **Order Ready** 🎉
   - Special email when order is ready
   - Shows pickup location and hours
   - Payment reminder if postpay

6. **Payment Reminders** 💳
   - For postpay orders with pending payment
   - Shows amount due
   - Link to pay online

---

## 📊 Email Tracking

Monitor emails in Resend Dashboard:
- **Emails** tab: See all sent emails
- **Logs** tab: Delivery status
- **Analytics** tab: Open rates, click rates

---

## 🔧 Customization

### Change Sender Email

In `api/send-email.ts`, update:
```typescript
from: 'Doc JS Laundry <noreply@docjslaundry.com>'
```

### Customize Templates

Edit the HTML in each `get*Email()` function in `api/send-email.ts`.

### Add New Email Types

1. Add new case in `api/send-email.ts`
2. Create template function
3. Add helper function in `app/src/lib/email.ts`

---

## 🚨 Error Handling

Emails are sent asynchronously and failures won't break your app:

```typescript
try {
  await sendOrderConfirmationEmail(data)
} catch (error) {
  console.error('Email failed:', error)
  // App continues normally
}
```

---

## 💰 Cost Estimate

**Resend Free Plan:**
- 100 emails/day
- 3,000 emails/month

**For Doc JS Laundry:**
- ~50 orders/day = 50 confirmation emails
- ~50 status updates = 50 emails
- ~10 admin messages = 10 emails
- **Total: ~110 emails/day**

**Recommendation:** Start with free plan, upgrade to $20/month when needed.

---

## ✅ Integration Checklist

- [ ] Install `resend` package
- [ ] Add `RESEND_API_KEY` to Vercel
- [ ] Redeploy app
- [ ] Add email to NewOrderPage (order confirmation)
- [ ] Add email to PaymentModal (payment confirmation)
- [ ] Add email to AdminPanel (status updates)
- [ ] Add email to SupportChat (admin messages)
- [ ] Test each email type
- [ ] Monitor in Resend dashboard

---

## 🎯 Next Steps

1. **Install and deploy** (Steps 1-2 above)
2. **Integrate emails** into your pages (Examples above)
3. **Test thoroughly** with real orders
4. **Monitor delivery** in Resend dashboard
5. **Customize templates** to match your brand

---

**Your customers will now receive beautiful, professional emails for every step of their order journey!** 📧✨
