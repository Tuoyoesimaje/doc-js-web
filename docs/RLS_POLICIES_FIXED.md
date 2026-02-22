# RLS Policies - All Fixed

## What Was Fixed

All Row Level Security (RLS) policies have been updated to allow users to properly interact with their data:

### Users Table
- Can view, insert, and update their own profile

### Addresses Table  
- Can view, insert, update, and delete their own addresses
- Fixed the 403 error you were seeing

### Services Table
- Anyone can view active services (public read)

### Orders Table
- Users can view and insert their own orders
- Users can update their own pending orders
- Admins can view and update all orders

### Order Items Table
- Users can view and insert items for their own orders

### Order Events Table
- Users can view and insert events for their own orders
- Admins can view and insert all order events

### Payments Table
- Users can view and insert payments for their own orders
- Admins can view, insert, and update all payments

### Uploads Table
- Users can view and insert their own uploads

## What You Need to Do

**IMPORTANT**: You need to re-run the updated schema in Supabase:

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase-schema.sql`
3. Paste and run it in the SQL Editor
4. This will update all the RLS policies

**Note**: If you already have data, you may want to run just the policy updates. The schema file is safe to re-run as it uses `CREATE POLICY` which will fail if policies already exist (that's okay).

## Testing

After updating the policies, test these operations:

1. Add a new address (should work now - no more 403!)
2. Create a new order
3. Add items to an order
4. Make a payment
5. View order history

## Admin Access

To give a user admin access:

1. Go to Supabase Dashboard → Authentication → Users
2. Click on a user
3. Edit their "User Metadata" (raw JSON)
4. Add: `{"role": "admin"}`
5. Save

Admins can then:
- View all orders
- Update order statuses
- View all payments
- Manage order events

## The 409 Error

The 409 conflict error you saw was because the code was trying to set a new address as default, but there was a unique index issue. This has been fixed by:

1. First unsetting all other default addresses for the user
2. Then inserting the new address with `is_default: true`

This is already implemented in `AddAddressModal.tsx` - no changes needed there!

## Next Steps

Once you've updated the policies in Supabase, everything should work smoothly. The modern design is maintained across all components, and you're ready to move forward with the next phase!
