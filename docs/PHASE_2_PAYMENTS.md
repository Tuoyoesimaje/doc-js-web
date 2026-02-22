# Phase 2: Payments & Notifications

This document outlines the implementation for Monnify payment integration and notification system.

## Overview

- **Payment Provider**: Monnify
- **Webhook Handler**: Supabase Edge Function
- **SMS Provider**: Twilio (already configured for OTP)
- **Email Provider**: Supabase (built-in)

## Part 1: Monnify Payment Integration

### 1.1 Get Monnify Credentials

1. Sign up at https://monnify.com
2. Complete KYC verification
3. Navigate to Settings > API Keys
4. Copy:
   - API Key
   - Secret Key
   - Contract Code

### 1.2 Add to Environment Variables

Update `app/.env`:

```env
VITE_MONNIFY_API_KEY=MK_TEST_...
VITE_MONNIFY_SECRET_KEY=...
VITE_MONNIFY_CONTRACT_CODE=...
```

### 1.3 Create Payment Component

Create `app/src/components/MonnifyPayment.tsx`:

```typescript
import { useEffect } from 'react'

interface MonnifyPaymentProps {
  amount: number
  email: string
  phone: string
  orderId: string
  onSuccess: (reference: string) => void
  onClose: () => void
}

declare global {
  interface Window {
    MonnifySDK: any
  }
}

export default function MonnifyPayment({
  amount,
  email,
  phone,
  orderId,
  onSuccess,
  onClose,
}: MonnifyPaymentProps) {
  useEffect(() => {
    // Load Monnify SDK
    const script = document.createElement('script')
    script.src = 'https://sdk.monnify.com/plugin/monnify.js'
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      initializePayment()
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const initializePayment = () => {
    window.MonnifySDK.initialize({
      amount: amount / 100, // Convert from cents to naira
      currency: 'NGN',
      reference: orderId,
      customerName: phone,
      customerEmail: email,
      apiKey: import.meta.env.VITE_MONNIFY_API_KEY,
      contractCode: import.meta.env.VITE_MONNIFY_CONTRACT_CODE,
      paymentDescription: `Laundry Order ${orderId.slice(0, 8)}`,
      metadata: {
        orderId,
      },
      onComplete: (response: any) => {
        if (response.status === 'SUCCESS') {
          onSuccess(response.transactionReference)
        }
      },
      onClose: () => {
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Complete Payment</h2>
        <p className="text-gray-600 mb-4">
          Amount: ₦{(amount / 100).toLocaleString()}
        </p>
        <div id="monnify-payment-widget"></div>
      </div>
    </div>
  )
}
```

### 1.4 Update OrderDetailPage

Add payment button to `app/src/pages/OrderDetailPage.tsx`:

```typescript
import { useState } from 'react'
import MonnifyPayment from '../components/MonnifyPayment'

// Inside component:
const [showPayment, setShowPayment] = useState(false)

const handlePaymentSuccess = async (reference: string) => {
  // Create payment record
  await supabase.from('payments').insert({
    order_id: order.id,
    provider: 'monnify',
    provider_payload: { reference },
    amount_cents: order.total_cents,
    status: 'pending', // Will be updated by webhook
  })

  setShowPayment(false)
  // Show success message
  alert('Payment initiated! Waiting for confirmation...')
}

// In JSX:
{order.payment_status === 'pending' && (
  <>
    <Button onClick={() => setShowPayment(true)} fullWidth size="lg">
      Pay ₦{(order.total_cents / 100).toLocaleString()}
    </Button>
    
    {showPayment && (
      <MonnifyPayment
        amount={order.total_cents}
        email={user?.email || ''}
        phone={user?.phone || ''}
        orderId={order.id}
        onSuccess={handlePaymentSuccess}
        onClose={() => setShowPayment(false)}
      />
    )}
  </>
)}
```

## Part 2: Webhook Handler (Supabase Edge Function)

### 2.1 Install Supabase CLI

```bash
npm install -g supabase
supabase login
```

### 2.2 Initialize Supabase Functions

```bash
supabase init
supabase functions new monnify-webhook
```

### 2.3 Create Webhook Handler

Create `supabase/functions/monnify-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload = await req.json()
    
    console.log('Webhook received:', payload)

    // Verify webhook signature (Monnify specific)
    const signature = req.headers.get('monnify-signature')
    // TODO: Verify signature with Monnify secret

    const {
      transactionReference,
      paymentReference,
      amountPaid,
      paidOn,
      paymentStatus,
      metaData,
    } = payload

    const orderId = metaData?.orderId

    if (!orderId) {
      throw new Error('Order ID not found in webhook payload')
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus === 'PAID' ? 'confirmed' : 'failed',
        provider_payload: payload,
        updated_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('provider', 'monnify')

    if (paymentError) throw paymentError

    // Update order payment status
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus === 'PAID' ? 'confirmed' : 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (orderError) throw orderError

    // Create order event
    await supabase.from('order_events').insert({
      order_id: orderId,
      event_type: 'payment_received',
      note: `Payment ${paymentStatus} - ${transactionReference}`,
    })

    // Trigger notification (SMS + Email)
    if (paymentStatus === 'PAID') {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('*, user:users(*)')
        .eq('id', orderId)
        .single()

      if (order?.user?.phone) {
        // Send SMS notification
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({
            to: order.user.phone,
            message: `Payment confirmed! Your order #${orderId.slice(0, 8)} is being processed. Track at docjslaundry.com/app`,
          }),
        })
      }

      // Send email notification
      // TODO: Implement email sending
    }

    return new Response(
      JSON.stringify({ success: true, orderId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### 2.4 Deploy Edge Function

```bash
supabase functions deploy monnify-webhook --no-verify-jwt
```

### 2.5 Configure Monnify Webhook

1. Go to Monnify Dashboard
2. Settings > Webhooks
3. Add webhook URL: `https://your-project.supabase.co/functions/v1/monnify-webhook`
4. Save

## Part 3: SMS Notifications

### 3.1 Create SMS Edge Function

```bash
supabase functions new send-sms
```

Create `supabase/functions/send-sms/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { to, message } = await req.json()
  
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER')
  
  const auth = btoa(`${accountSid}:${authToken}`)
  
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromNumber,
        Body: message,
      }),
    }
  )
  
  const data = await response.json()
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 3.2 Deploy SMS Function

```bash
supabase functions deploy send-sms
```

### 3.3 Set Secrets

```bash
supabase secrets set TWILIO_ACCOUNT_SID=your_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_token
supabase secrets set TWILIO_PHONE_NUMBER=your_number
```

## Part 4: Email Notifications

### 4.1 Configure Email Templates

1. Go to Supabase > Authentication > Email Templates
2. Create custom templates:

**Order Confirmation:**
```html
<h2>Order Confirmed!</h2>
<p>Hi {{ .Name }},</p>
<p>Your order #{{ .OrderId }} has been confirmed.</p>
<p>Total: ₦{{ .Total }}</p>
<p>Track your order: <a href="{{ .TrackingUrl }}">View Order</a></p>
```

**Order Ready:**
```html
<h2>Your Order is Ready!</h2>
<p>Hi {{ .Name }},</p>
<p>Your order #{{ .OrderId }} is ready for pickup/delivery.</p>
<p><a href="{{ .TrackingUrl }}">View Details</a></p>
```

### 4.2 Create Email Edge Function

```bash
supabase functions new send-email
```

Create `supabase/functions/send-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { to, subject, html } = await req.json()
  
  // Use Supabase's built-in email or external service like SendGrid
  // For now, using a simple SMTP service
  
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('SENDGRID_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: 'orders@docjslaundry.com', name: 'Doc JS Laundry' },
      subject,
      content: [{ type: 'text/html', value: html }],
    }),
  })
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

## Part 5: Notification Triggers

### 5.1 Create Database Trigger

Add to `supabase-schema.sql`:

```sql
-- Function to send notifications on status change
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify on specific status changes
  IF NEW.status IN ('processing', 'ready', 'delivered') AND NEW.status != OLD.status THEN
    -- Call Edge Function to send notifications
    PERFORM net.http_post(
      url := current_setting('app.supabase_url') || '/functions/v1/send-order-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'order_id', NEW.id,
        'status', NEW.status
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to orders table
CREATE TRIGGER order_status_notification
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();
```

### 5.2 Create Notification Edge Function

```bash
supabase functions new send-order-notification
```

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { order_id, status } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  // Get order with user details
  const { data: order } = await supabase
    .from('orders')
    .select('*, user:users(*)')
    .eq('id', order_id)
    .single()
  
  if (!order) return new Response('Order not found', { status: 404 })
  
  const messages = {
    processing: 'Your order is being processed',
    ready: 'Your order is ready for pickup!',
    delivered: 'Your order has been delivered',
  }
  
  // Send SMS for 'ready' status only
  if (status === 'ready' && order.user.phone) {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: order.user.phone,
        message: `${messages[status]} - Order #${order_id.slice(0, 8)}. Track at docjslaundry.com/app`,
      }),
    })
  }
  
  // Send email for all status changes
  if (order.user.email) {
    await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: order.user.email,
        subject: `Order Update: ${messages[status]}`,
        html: `
          <h2>${messages[status]}</h2>
          <p>Order #${order_id.slice(0, 8)}</p>
          <p>Total: ₦${(order.total_cents / 100).toLocaleString()}</p>
          <a href="https://docjslaundry.com/app/orders/${order_id}">View Order</a>
        `,
      }),
    })
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

## Testing Phase 2

### Payment Flow Test
1. Create order
2. Click "Pay Now"
3. Monnify modal opens
4. Complete payment (use test card)
5. Webhook received
6. Payment status updated
7. SMS sent
8. Email sent

### Notification Test
1. Admin updates order to "processing"
2. Email sent (no SMS)
3. Admin updates to "ready"
4. SMS + Email sent
5. Admin updates to "delivered"
6. Email sent (no SMS)

## Next: Phase 3

After payments and notifications work:
- Natural language parsing (Claude API)
- Order templates
- Subscription plans
- Barcode tracking
- Rating system
