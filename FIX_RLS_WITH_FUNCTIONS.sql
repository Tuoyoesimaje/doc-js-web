-- =============================================
-- FIX RLS INFINITE RECURSION WITH FUNCTIONS
-- =============================================
-- Use SECURITY DEFINER functions to bypass RLS and prevent recursion
-- =============================================

-- =============================================
-- HELPER FUNCTIONS (SECURITY DEFINER bypasses RLS)
-- =============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (is_admin = true OR role = 'admin')
  );
END;
$;

-- Function to check if current user is an active employee
CREATE OR REPLACE FUNCTION is_employee()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees 
    WHERE user_id = auth.uid() 
    AND is_active = true
  );
END;
$;

-- =============================================
-- USERS TABLE - Clean slate with function-based policies
-- =============================================

-- Drop all existing users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own admin status" ON users;
DROP POLICY IF EXISTS "Employees can create walk-in customer records" ON users;
DROP POLICY IF EXISTS "Employees can view walk-in customers" ON users;
DROP POLICY IF EXISTS "Users view own record" ON users;
DROP POLICY IF EXISTS "Users update own record" ON users;
DROP POLICY IF EXISTS "Users insert own record" ON users;
DROP POLICY IF EXISTS "Admins view all users" ON users;
DROP POLICY IF EXISTS "Admins update all users" ON users;
DROP POLICY IF EXISTS "Admins insert users" ON users;

-- Users can view their own record OR admins can view all
CREATE POLICY "Users and admins view users"
  ON users FOR SELECT
  USING (id = auth.uid() OR is_admin());

-- Users can update their own record OR admins can update any
CREATE POLICY "Users and admins update users"
  ON users FOR UPDATE
  USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

-- Users can insert their own record OR admins/employees can insert any
CREATE POLICY "Users, admins, and employees insert users"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid() OR is_admin() OR is_employee());

-- =============================================
-- EMPLOYEES TABLE - Clean slate with function-based policies
-- =============================================

-- Drop all existing employees policies
DROP POLICY IF EXISTS "Employees can view own record" ON employees;
DROP POLICY IF EXISTS "Employees can view colleagues at their location" ON employees;
DROP POLICY IF EXISTS "Admins can view all employees" ON employees;
DROP POLICY IF EXISTS "Admins can manage employees" ON employees;
DROP POLICY IF EXISTS "Employees view own record" ON employees;
DROP POLICY IF EXISTS "Admins view all employees" ON employees;
DROP POLICY IF EXISTS "Admins manage employees" ON employees;

-- Employees can view their own record OR admins can view all
CREATE POLICY "Employees and admins view employees"
  ON employees FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Only admins can manage employees
CREATE POLICY "Admins manage employees"
  ON employees FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================
-- ORDERS TABLE - Update with function-based policies
-- =============================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Employees can view orders they created" ON orders;
DROP POLICY IF EXISTS "Employees can create orders" ON orders;
DROP POLICY IF EXISTS "Employees can update their orders" ON orders;
DROP POLICY IF EXISTS "Employees view own orders" ON orders;
DROP POLICY IF EXISTS "Employees create orders" ON orders;
DROP POLICY IF EXISTS "Employees update own orders" ON orders;

-- Users, employees, and admins can view orders
CREATE POLICY "All users view relevant orders"
  ON orders FOR SELECT
  USING (
    user_id = auth.uid() 
    OR is_admin()
    OR (is_employee() AND created_by_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    ))
  );

-- Users and employees can create orders
CREATE POLICY "Users and employees create orders"
  ON orders FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_employee() OR is_admin());

-- Users, employees, and admins can update orders
CREATE POLICY "All users update relevant orders"
  ON orders FOR UPDATE
  USING (
    user_id = auth.uid() 
    OR is_admin()
    OR (is_employee() AND created_by_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    ))
  );

-- =============================================
-- ADDRESSES TABLE - Update with function-based policies
-- =============================================

-- Drop and recreate address policies
DROP POLICY IF EXISTS "Employees create addresses" ON addresses;

-- Users, employees, and admins can create addresses
CREATE POLICY "All users create addresses"
  ON addresses FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_employee() OR is_admin());

-- =============================================
-- ORDER_ITEMS TABLE - Update with function-based policies
-- =============================================

-- Employees can create order items
CREATE POLICY "Employees create order items"
  ON order_items FOR INSERT
  WITH CHECK (
    is_employee() OR is_admin()
    OR EXISTS (
      SELECT 1 FROM orders WHERE id = order_items.order_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- ORDER_EVENTS TABLE - Update with function-based policies
-- =============================================

-- Employees can create order events
CREATE POLICY "Employees create order events"
  ON order_events FOR INSERT
  WITH CHECK (
    is_employee() OR is_admin()
    OR EXISTS (
      SELECT 1 FROM orders WHERE id = order_events.order_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- GARMENT_TAGS TABLE - Update with function-based policies
-- =============================================

-- Employees can create garment tags
CREATE POLICY "Employees create garment tags"
  ON garment_tags FOR INSERT
  WITH CHECK (is_employee() OR is_admin());

-- Employees can update garment tags
CREATE POLICY "Employees update garment tags"
  ON garment_tags FOR UPDATE
  USING (is_employee() OR is_admin());

-- =============================================
-- NOTES
-- =============================================
-- SECURITY DEFINER functions bypass RLS, preventing infinite recursion
-- 
-- Benefits:
-- - No circular dependencies between tables
-- - Clean, simple policies
-- - Easy to understand and maintain
-- - Functions can be reused across multiple policies
--
-- Security:
-- - Functions use SET search_path = public for security
-- - Functions only check specific conditions, no data modification
-- - RLS policies still enforce row-level access control
--
-- Performance:
-- - Functions are cached and fast
-- - No complex joins in policies
-- - Simpler query plans
-- =============================================
