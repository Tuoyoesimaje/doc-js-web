-- ============================================
-- MIGRATION: Add Prepay/Postpay Payment Methods
-- ============================================
-- Run this in Supabase SQL Editor if you already have the orders table

-- Add payment method columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('prepay', 'postpay')) DEFAULT 'prepay',
ADD COLUMN IF NOT EXISTS pickup_fee_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS final_payment_pending BOOLEAN DEFAULT FALSE;

-- Update existing orders to have default payment method
UPDATE orders 
SET payment_method = 'prepay', pickup_fee_paid = FALSE, final_payment_pending = FALSE 
WHERE payment_method IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.payment_method IS 'Payment method: prepay (full payment upfront), postpay (pickup fee first, rest later)';
COMMENT ON COLUMN orders.pickup_fee_paid IS 'For postpay orders: has customer paid the pickup fee?';
COMMENT ON COLUMN orders.final_payment_pending IS 'For postpay orders: is final payment still pending?';
