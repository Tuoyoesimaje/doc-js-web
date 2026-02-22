# Resend Email Setup for Doc JS Laundry

## Why Resend?
- ✅ 100 emails/day free (3,000/month)
- ✅ Fast delivery
- ✅ Easy setup with Supabase
- ✅ Professional email templates
- ✅ Good deliverability

## Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up with your email
3. Verify your email address

## Step 2: Add Your Domain

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain: `docjslaundry.com`
4. Add the DNS records Resend provides to your domain registrar:

```
Type: TXT
Name: @
Value: [Resend will provide this]

Type: CNAME
Name: resend._domainkey
Value: [Resend will provide this]
```

5. Wait for verification (usually 5-10 minutes)

## Step 3: Get API Key

1. In Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Name it: `Doc JS Laundry - Supabase`
4. Copy the API key (starts with `re_`)

## Step 4: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Email Templates**
3. Click **Settings** (gear icon)
4. Scroll to **SMTP Settings**
5. Enable **Custom SMTP**
6. Enter these settings:

```
Sender name: Doc JS Laundry
Sender email: noreply@docjslaundry.com
Host: smtp.resend.com
Port: 465
Username: resend
Password: [Your Resend API Key]
```

7. Click **Save**

## Step 5: Customize Email Templates

In Supabase → **Authentication → Email Templates**, customize these:

### Confirm Signup
```html
<h2>Welcome to Doc JS Laundry!</h2>
<p>Click the link below to confirm your email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>If you didn't create an account, you can safely ignore this email.</p>
```

### Magic Link
```html
<h2>Sign in to Doc JS Laundry</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>This link expires in 1 hour.</p>
```

### Reset Password
```html
<h2>Reset Your Password</h2>
<p>Click the link below to reset your password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
```

### Email Change
```html
<h2>Confirm Email Change</h2>
<p>Click the link below to confirm your new email address:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm New Email</a></p>
```

## Step 6: Test Email Delivery

1. Go to your app login page
2. Try signing up with a new email
3. Check your inbox for the confirmation email
4. Should arrive within seconds!

## Step 7: Monitor Email Delivery

In Resend dashboard:
- **Emails** tab shows all sent emails
- **Logs** tab shows delivery status
- **Analytics** shows open rates, click rates

## Email Types Handled

### Authentication Emails (via Supabase)
- ✅ Signup confirmation
- ✅ Magic link login
- ✅ Password reset
- ✅ Email change confirmation
- ✅ Admin OTP (when enabled)

### Transactional Emails (Future)
You can add these later:
- Order confirmation
- Order status updates
- Payment receipts
- Delivery notifications

## Resend Limits

**Free Plan:**
- 100 emails/day
- 3,000 emails/month
- 1 domain
- 1 API key

**Paid Plans (if needed):**
- $20/month: 50,000 emails
- $80/month: 100,000 emails

## Troubleshooting

### Emails not sending
1. Check Resend API key is correct
2. Verify domain is verified in Resend
3. Check Supabase SMTP settings
4. Look at Resend logs for errors

### Emails going to spam
1. Make sure domain is verified
2. Add SPF and DKIM records (Resend provides these)
3. Use a professional sender email (noreply@docjslaundry.com)
4. Don't send too many emails at once

### Domain verification taking long
- DNS changes can take up to 48 hours
- Check your domain registrar's DNS settings
- Make sure you added the exact records Resend provided

## Best Practices

1. **Use a subdomain for sending:**
   - `noreply@docjslaundry.com` ✅
   - Not `admin@docjslaundry.com` ❌

2. **Keep templates professional:**
   - Clear subject lines
   - Branded design
   - Mobile-friendly

3. **Monitor delivery:**
   - Check Resend dashboard regularly
   - Watch for bounces
   - Track open rates

4. **Don't spam:**
   - Only send necessary emails
   - Respect unsubscribe requests
   - Follow email best practices

## Future Enhancements

### Order Confirmation Emails
When a customer places an order, send:
```
Subject: Order Confirmed - #12345
Body: Your order has been received...
```

### Status Update Emails
When order status changes:
```
Subject: Your Order is Ready for Pickup!
Body: Order #12345 is ready...
```

### Payment Receipts
After successful payment:
```
Subject: Payment Receipt - ₦5,000
Body: Thank you for your payment...
```

## Cost Estimate

For Doc JS Laundry:
- ~50 orders/day = 50 confirmation emails
- ~50 status updates/day = 50 emails
- ~10 auth emails/day = 10 emails
- **Total: ~110 emails/day**

**Recommendation:** Start with free plan (100/day), upgrade to $20/month plan when you exceed 100 emails/day consistently.

## Setup Checklist

- [ ] Create Resend account
- [ ] Add domain to Resend
- [ ] Add DNS records to domain registrar
- [ ] Wait for domain verification
- [ ] Get Resend API key
- [ ] Configure Supabase SMTP settings
- [ ] Customize email templates
- [ ] Test signup email
- [ ] Test magic link email
- [ ] Monitor first few emails in Resend dashboard

---

**Once configured, all authentication emails will be sent via Resend with professional branding and fast delivery!** 📧✨
