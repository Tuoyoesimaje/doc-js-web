-- =============================================
-- FIX WALK-IN CUSTOMER CREATION
-- =============================================
-- Allow employees to create user records for walk-in customers
-- without requiring auth.signUp() which has rate limiting
-- =============================================

-- Allow employees to insert user records for walk-in customers
CREATE POLICY "Employees can create walk-in customer records"
  ON users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Allow employees to view user records they created (for walk-in customers)
CREATE POLICY "Employees can view walk-in customers"
  ON users FOR SELECT
  USING (
    -- User can view their own record
    id = auth.uid()
    OR
    -- Employees can view users who have orders at their location
    EXISTS (
      SELECT 1 FROM orders o
      JOIN employees e ON e.id = o.created_by_employee_id
      WHERE o.user_id = users.id
      AND e.user_id = auth.uid()
      AND e.is_active = true
    )
  );

-- =============================================
-- NOTES
-- =============================================
-- Walk-in customers are created as user records WITHOUT auth accounts
-- This avoids Supabase rate limiting on auth.signUp()
-- 
-- Walk-in customers can later:
-- 1. Create an auth account using their phone number
-- 2. Link their existing orders to their new auth account
-- 3. Start using the customer portal
--
-- The user record is created with:
-- - phone: Customer's phone number
-- - display_name: Customer's name
-- - email: Optional email
-- - password_set: false (no auth account yet)
-- =============================================
