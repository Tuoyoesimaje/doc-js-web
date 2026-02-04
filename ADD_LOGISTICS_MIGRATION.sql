-- ============================================
-- MIGRATION: Add Logistics Options to Orders
-- ============================================
-- Run this in Supabase SQL Editor if you already have the orders table

-- Add logistics columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS logistics_option TEXT CHECK (logistics_option IN ('none', 'pickup', 'pickup_delivery')) DEFAULT 'none',
ADD COLUMN IF NOT EXISTS logistics_fee_cents INTEGER DEFAULT 0;

-- Update existing orders to have default logistics values
UPDATE orders 
SET logistics_option = 'none', logistics_fee_cents = 0 
WHERE logistics_option IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.logistics_option IS 'Logistics service: none (customer brings to shop), pickup (we pickup only), pickup_delivery (full service)';
COMMENT ON COLUMN orders.logistics_fee_cents IS 'Logistics fee in kobo: 0 for none, 200000 for pickup, 400000 for pickup_delivery';
