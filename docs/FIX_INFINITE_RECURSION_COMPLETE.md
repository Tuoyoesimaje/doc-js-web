## Fix Infinite Recursion in RLS Policies - COMPLETE SOLUTION

## Problem

Multiple 500 errors with "infinite recursion detected in policy for relation 'users'":
```
GET .../users?select=*&id=eq.[uuid] 500 (Internal Server Error)
POST .../users 500 (Internal Server Error)
GET .../employees?select=id&user_id=eq.[uuid] 500 (Internal Server Error)
```

This was breaking:
- User login and signup
- Role-based redirects
- Walk-in customer creation
- Order loading
- Support chat
- All dashboard functionality

## Root Cause

Circular dependencies in RLS policies:

1. **Users table policies** referenced **employees table**
2. **Employees table policies** referenced **users table**
3. **Admin checks** queried users table within users table policies

Example of problematic policy:
```sql
-- BAD: Causes infinite recursion
CREATE POLICY "Employees can view walk-in customers"
  ON users FOR SELECT
  USING (
    id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM orders o
      JOIN employees e ON e.id = o.created_by_employee_id  -- ❌ Queries employees
      WHERE o.user_id = users.id
      AND e.user_id = auth.uid()  -- ❌ Which queries users again
    )
  );
```

When a query tries to access the users table:
1. RLS policy checks if user can access the row
2. Policy queries employees table
3. Employees table RLS policy queries users table
4. Infinite loop → 500 error

## Solution: SECURITY DEFINER Functions

Use PostgreSQL functions with `SECURITY DEFINER` to bypass RLS and break the circular dependency:

```sql
-- Function bypasses RLS, no recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with function owner's privileges, bypassing RLS
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

-- Clean policy using function
CREATE POLICY "Users and admins view users"
  ON users FOR SELECT
  USING (id = auth.uid() OR is_admin());  -- ✅ No recursion
```

## Migration Steps

### 1. Run the SQL Migration

Execute `FIX_RLS_WITH_FUNCTIONS.sql` in your Supabase SQL Editor.

This will:
1. Create `is_admin()` and `is_employee()` helper functions
2. Drop all problematic RLS policies
3. Create new, clean policies using the functions

### 2. Test All Functionality

After running the migration, test:
- [ ] User login (email, phone, Google)
- [ ] User signup
- [ ] Role-based redirect (admin → /admin, employee → /employee, customer → /dashboard)
- [ ] Walk-in customer creation by employees
- [ ] Order creation and viewing
- [ ] Support chat
- [ ] Dashboard loading

## What Changed

### Before (Recursive Policies):
```sql
-- ❌ Queries employees table, which queries users table
CREATE POLICY "Employees can view walk-in customers"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN employees e ON e.id = o.created_by_employee_id
      WHERE e.user_id = auth.uid()
    )
  );

-- ❌ Queries users table within users table policy
CREATE POLICY "Admins view all users"
  ON users FOR SELECT
  USING (
    (SELECT is_admin FROM users WHERE id = auth.uid()) = true
  );
```

### After (Function-Based Policies):
```sql
-- ✅ Function bypasses RLS, no recursion
CREATE FUNCTION is_admin() RETURNS BOOLEAN
SECURITY DEFINER AS $
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (is_admin = true OR role = 'admin')
  );
END;
$;

-- ✅ Clean policy using function
CREATE POLICY "Users and admins view users"
  ON users FOR SELECT
  USING (id = auth.uid() OR is_admin());
```

## Benefits

### Security:
- ✅ SECURITY DEFINER functions bypass RLS safely
- ✅ Functions only check conditions, no data modification
- ✅ SET search_path = public prevents SQL injection
- ✅ RLS policies still enforce row-level access control

### Performance:
- ✅ Functions are cached and fast
- ✅ No complex joins in policies
- ✅ Simpler query plans
- ✅ Fewer database round trips

### Maintainability:
- ✅ Clean, simple policies
- ✅ Easy to understand
- ✅ Functions can be reused across multiple policies
- ✅ No circular dependencies

## How It Works

### Function Execution:
1. User makes a query to users table
2. RLS policy calls `is_admin()` function
3. Function runs with SECURITY DEFINER (bypasses RLS)
4. Function returns true/false
5. Policy uses result to allow/deny access
6. No recursion because function bypasses RLS

### Example Flow:
```
User Query: SELECT * FROM users WHERE id = 'abc123'
  ↓
RLS Policy: USING (id = auth.uid() OR is_admin())
  ↓
Function: is_admin() [SECURITY DEFINER - bypasses RLS]
  ↓
Direct Query: SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
  ↓
Result: true/false
  ↓
Policy Decision: Allow/Deny access
```

## Policies Created

### Users Table:
- Users can view their own record OR admins can view all
- Users can update their own record OR admins can update any
- Users, admins, and employees can insert users (for walk-in customers)

### Employees Table:
- Employees can view their own record OR admins can view all
- Only admins can manage employees (INSERT, UPDATE, DELETE)

### Orders Table:
- Users, employees, and admins can view relevant orders
- Users and employees can create orders
- Users, employees, and admins can update relevant orders

### Addresses Table:
- Users, employees, and admins can create addresses

### Order Items, Events, Garment Tags:
- Employees and admins can create/update

## Troubleshooting

### If you still see recursion errors:

1. **Check if migration ran successfully**
   ```sql
   -- Verify functions exist
   SELECT proname FROM pg_proc WHERE proname IN ('is_admin', 'is_employee');
   ```

2. **Check if old policies were dropped**
   ```sql
   -- List all policies on users table
   SELECT policyname FROM pg_policies WHERE tablename = 'users';
   ```

3. **Manually drop problematic policies**
   ```sql
   DROP POLICY IF EXISTS "policy_name" ON table_name;
   ```

4. **Re-run the migration**

### If walk-in customer creation fails:

Make sure the employee has an active record in the employees table:
```sql
SELECT * FROM employees WHERE user_id = 'your-employee-user-id';
```

## Files Created

1. `FIX_RLS_WITH_FUNCTIONS.sql` - Complete migration with functions and policies
2. `FIX_ALL_RLS_INFINITE_RECURSION.sql` - Alternative approach (not recommended)
3. `FIX_INFINITE_RECURSION_COMPLETE.md` - This documentation

## Previous Attempts

- `FIX_EMPLOYEE_RLS_INFINITE_RECURSION.sql` - Fixed employees table only (incomplete)
- `FIX_WALKIN_CUSTOMER_CREATION.sql` - Caused users table recursion (problematic)

These should be ignored in favor of `FIX_RLS_WITH_FUNCTIONS.sql`.

---

**Status**: ✅ COMPLETE - Run FIX_RLS_WITH_FUNCTIONS.sql and test all functionality
