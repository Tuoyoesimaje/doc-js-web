# Fix Walk-In Customer Rate Limit Error

## Problem

When creating walk-in orders through the Employee Portal, the app was throwing a 429 error:
```
POST .../auth/v1/signup 429 (Too Many Requests)
AuthApiError: For security purposes, you can only request this after 17 seconds.
```

This happened because the app was calling `supabase.auth.signUp()` for each walk-in customer, and Supabase has rate limiting that prevents multiple signups in quick succession.

## Root Cause

The `WalkInOrderPage.tsx` was creating a full auth account for every walk-in customer:

```typescript
// OLD CODE - CAUSES RATE LIMITING
const { data: authUser, error: authError } = await supabase.auth.signUp({
  email: customerEmail || `${customerPhone}@walkin.docjslaundry.com`,
  password: Math.random().toString(36).slice(-12),
  options: {
    data: {
      display_name: customerName,
      phone: customerPhone,
    }
  }
})
```

This approach has several issues:
1. **Rate Limiting**: Can only create 1 account every 17 seconds
2. **Unnecessary**: Walk-in customers don't need app access immediately
3. **Email Spam**: Sends confirmation emails to fake email addresses
4. **Poor UX**: Employees have to wait between customers

## Solution

### 1. Create User Records Directly (No Auth Account)

Walk-in customers are now created as user records in the database WITHOUT auth accounts:

```typescript
// NEW CODE - NO RATE LIMITING
const { data: newUser, error: userError } = await supabase
  .from('users')
  .insert({
    phone: normalizedPhone,
    email: customerEmail || null,
    display_name: customerName,
    password_set: false,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
  })
  .select()
  .single()
```

### 2. Update RLS Policies

Run `FIX_WALKIN_CUSTOMER_CREATION.sql` to allow employees to create user records:

```sql
-- Allow employees to insert user records
CREATE POLICY "Employees can create walk-in customer records"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );
```

## Benefits

### Before (Auth Signup):
- ❌ Rate limited to 1 customer every 17 seconds
- ❌ Sends unnecessary confirmation emails
- ❌ Creates auth accounts customers may never use
- ❌ Blocks employee workflow during busy times
- ❌ Wastes auth quota

### After (Direct User Record):
- ✅ No rate limiting - create unlimited customers
- ✅ No confirmation emails sent
- ✅ Customers can create auth accounts later if they want
- ✅ Fast, smooth employee workflow
- ✅ Efficient resource usage

## Walk-In Customer Journey

### At the Shop (Employee Creates Order):
1. Employee enters customer name and phone
2. User record created in database (no auth account)
3. Order created and linked to user record
4. Garment tags generated
5. Customer receives clothes with tags

### Later (Customer Wants App Access):
1. Customer downloads app or visits website
2. Customer signs up with their phone number
3. System detects existing user record by phone
4. Auth account linked to existing user record
5. Customer can now see their order history

## Technical Details

### User Record Structure (Walk-In):
```typescript
{
  id: 'uuid',
  phone: '+2348012345678',
  email: null, // or customer email if provided
  display_name: 'John Doe',
  password_set: false, // No auth account yet
  created_at: '2025-02-14T...',
  last_login: '2025-02-14T...'
}
```

### Linking Auth Account Later:
When a walk-in customer creates an auth account:
1. They sign up with their phone number
2. Supabase creates auth.users record
3. Our trigger checks if user record exists by phone
4. If exists, updates the existing record with auth user_id
5. Customer now has access to their order history

### RLS Policy Logic:
- Employees can INSERT user records (for walk-in customers)
- Employees can SELECT users who have orders at their location
- Users can SELECT their own record
- Admins can do everything

## Migration Steps

### 1. Apply SQL Migration
Run `FIX_WALKIN_CUSTOMER_CREATION.sql` in Supabase SQL Editor

### 2. Code Already Updated
The `WalkInOrderPage.tsx` has been updated to use direct user record creation

### 3. Test Walk-In Flow
1. Log in as employee
2. Create walk-in order
3. Add another walk-in order immediately (no 17-second wait)
4. Verify both orders created successfully
5. Check that no confirmation emails were sent

## Edge Cases Handled

### Duplicate Phone Numbers:
- System checks if user exists by phone before creating
- If exists, reuses existing user record
- Prevents duplicate customer records

### Phone Number Normalization:
```typescript
const normalizedPhone = customerPhone.startsWith('+') 
  ? customerPhone 
  : `+234${customerPhone.replace(/^0/, '')}`
```
- Handles both formats: "08012345678" and "+2348012345678"
- Ensures consistent phone number storage

### Optional Email:
- Email is optional for walk-in customers
- If provided, stored in user record
- If not provided, set to null (not a fake email)

## Files Modified

1. `app/src/pages/WalkInOrderPage.tsx` - Updated to create user records directly
2. `FIX_WALKIN_CUSTOMER_CREATION.sql` - RLS policies for employee user creation

## Testing Checklist

- [ ] Employee can create walk-in order
- [ ] Employee can create multiple orders quickly (no 17-second wait)
- [ ] No 429 rate limit errors
- [ ] No confirmation emails sent to fake addresses
- [ ] Customer phone number stored correctly
- [ ] Orders linked to correct user records
- [ ] Garment tags generated successfully
- [ ] Walk-in customer can later create auth account and see order history

---

**Status**: ✅ FIXED - Apply SQL migration and test
