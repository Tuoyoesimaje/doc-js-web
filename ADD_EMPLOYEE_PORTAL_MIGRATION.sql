-- =============================================
-- EMPLOYEE PORTAL MIGRATION
-- =============================================
-- This migration adds employee management and
-- pickup location functionality for walk-in customers
-- =============================================

-- Create pickup_locations table
CREATE TABLE IF NOT EXISTS pickup_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Warri',
  state TEXT DEFAULT 'Delta',
  phone TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pickup_location_id UUID REFERENCES pickup_locations(id) ON DELETE SET NULL,
  employee_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'staff', -- staff, manager, admin
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add employee tracking to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS created_by_employee_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS pickup_location_id UUID REFERENCES pickup_locations(id);

-- Add employee tracking to garment_tags
ALTER TABLE garment_tags
ADD COLUMN IF NOT EXISTS created_by_employee_id UUID REFERENCES employees(id),
ADD COLUMN IF NOT EXISTS pickup_location_id UUID REFERENCES pickup_locations(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_location ON employees(pickup_location_id);
CREATE INDEX IF NOT EXISTS idx_orders_employee ON orders(created_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(pickup_location_id);
CREATE INDEX IF NOT EXISTS idx_tags_employee ON garment_tags(created_by_employee_id);
CREATE INDEX IF NOT EXISTS idx_tags_location ON garment_tags(pickup_location_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_pickup_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_employees_updated_at ON employees;
CREATE TRIGGER trigger_update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_employees_updated_at();

DROP TRIGGER IF EXISTS trigger_update_pickup_locations_updated_at ON pickup_locations;
CREATE TRIGGER trigger_update_pickup_locations_updated_at
  BEFORE UPDATE ON pickup_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_pickup_locations_updated_at();

-- RLS Policies for pickup_locations
ALTER TABLE pickup_locations ENABLE ROW LEVEL SECURITY;

-- Everyone can view active pickup locations
CREATE POLICY "Anyone can view active pickup locations"
  ON pickup_locations FOR SELECT
  USING (is_active = true);

-- Admins can manage pickup locations
CREATE POLICY "Admins can manage pickup locations"
  ON pickup_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- RLS Policies for employees
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Employees can view their own record
CREATE POLICY "Employees can view their own record"
  ON employees FOR SELECT
  USING (user_id = auth.uid());

-- Employees can view other employees at their location
CREATE POLICY "Employees can view colleagues at their location"
  ON employees FOR SELECT
  USING (
    pickup_location_id IN (
      SELECT pickup_location_id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Admins can view all employees
CREATE POLICY "Admins can view all employees"
  ON employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- Admins can manage employees
CREATE POLICY "Admins can manage employees"
  ON employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- Update orders RLS to allow employees to view orders they created
CREATE POLICY "Employees can view orders they created"
  ON orders FOR SELECT
  USING (
    created_by_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- Employees can create orders
CREATE POLICY "Employees can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Employees can update orders they created
CREATE POLICY "Employees can update their orders"
  ON orders FOR UPDATE
  USING (
    created_by_employee_id IN (
      SELECT id FROM employees WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- SEED DATA - 3 Pickup Locations in Warri
-- =============================================

INSERT INTO pickup_locations (name, address, city, state, phone, email) VALUES
  ('Doc JS Effurun', 'Effurun Main Road, Effurun', 'Warri', 'Delta', '+2349060904176', 'effurun@docjslaundry.com'),
  ('Doc JS Airport Road', 'Airport Road/PTI Area', 'Warri', 'Delta', '+2349060904176', 'airport@docjslaundry.com'),
  ('Doc JS Ubeji', 'Ubeji Main Road, Ubeji', 'Warri', 'Delta', '+2349060904176', 'ubeji@docjslaundry.com')
ON CONFLICT DO NOTHING;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get employee by user_id
CREATE OR REPLACE FUNCTION get_employee_by_user_id(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  employee_name TEXT,
  pickup_location_id UUID,
  location_name TEXT,
  role TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.employee_name,
    e.pickup_location_id,
    pl.name as location_name,
    e.role
  FROM employees e
  LEFT JOIN pickup_locations pl ON e.pickup_location_id = pl.id
  WHERE e.user_id = p_user_id AND e.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is an employee
CREATE OR REPLACE FUNCTION is_employee(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM employees 
    WHERE user_id = p_user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- EXAMPLE USAGE
-- =============================================

-- Create an employee:
-- INSERT INTO employees (user_id, pickup_location_id, employee_name, phone, role)
-- VALUES ('user-uuid', 'location-uuid', 'John Doe', '08012345678', 'staff');

-- Get employee info:
-- SELECT * FROM get_employee_by_user_id('user-uuid');

-- Check if user is employee:
-- SELECT is_employee('user-uuid');

-- Create order as employee:
-- INSERT INTO orders (user_id, created_by_employee_id, pickup_location_id, ...)
-- VALUES ('customer-uuid', 'employee-uuid', 'location-uuid', ...);

-- Get orders by location:
-- SELECT * FROM orders WHERE pickup_location_id = 'location-uuid';

-- Get orders by employee:
-- SELECT * FROM orders WHERE created_by_employee_id = 'employee-uuid';
