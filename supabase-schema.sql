-- ============================================
-- DOC JS LAUNDRY - SUPABASE SCHEMA
-- ============================================
-- Tables: users, addresses, services, orders, order_items, order_events, payments, uploads
-- RLS: customers see only their data, admin sees all, edge functions can update payments/status

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
-- Extends Supabase auth.users with app-specific fields
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  display_name TEXT,
  password_set BOOLEAN DEFAULT FALSE,
  google_provider_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_email ON users(email);

-- ============================================
-- ADDRESSES TABLE
-- ============================================
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- e.g., "Home", "Office"
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  lat NUMERIC(10, 8),
  lng NUMERIC(11, 8),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(user_id, is_default) WHERE is_default = TRUE;

-- ============================================
-- SERVICES TABLE
-- ============================================
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL, -- e.g., "shirt", "trouser", "bedsheet"
  name TEXT NOT NULL,
  base_price_cents INTEGER NOT NULL,
  unit TEXT DEFAULT 'piece', -- piece, kg, set
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_key ON services(key);
CREATE INDEX idx_services_active ON services(is_active) WHERE is_active = TRUE;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TYPE order_status AS ENUM ('received', 'processing', 'ready', 'delivered');
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed', 'refunded');

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address_id UUID NOT NULL REFERENCES addresses(id),
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'NGN',
  status order_status DEFAULT 'received',
  payment_status payment_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price_cents INTEGER NOT NULL,
  modifiers JSONB DEFAULT '{}', -- e.g., {"express": true, "starch": "heavy"}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- ORDER_EVENTS TABLE
-- ============================================
CREATE TYPE order_event_type AS ENUM (
  'created', 
  'payment_received', 
  'received', 
  'processing', 
  'ready', 
  'delivered',
  'cancelled'
);

CREATE TABLE order_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_type order_event_type NOT NULL,
  note TEXT,
  actor_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_events_order_id ON order_events(order_id);
CREATE INDEX idx_order_events_created_at ON order_events(created_at DESC);

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'monnify',
  provider_payload JSONB DEFAULT '{}',
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status payment_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================
-- UPLOADS TABLE
-- ============================================
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  url TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploads_user_id ON uploads(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS POLICIES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- ADDRESSES POLICIES
-- ============================================
CREATE POLICY "Users can view own addresses"
  ON addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own addresses"
  ON addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own addresses"
  ON addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- SERVICES POLICIES (public read)
-- ============================================
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  USING (is_active = TRUE);

-- ============================================
-- ORDERS POLICIES
-- ============================================
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pending orders"
  ON orders FOR UPDATE
  USING (auth.uid() = user_id AND status = 'received');

-- ============================================
-- ORDER_ITEMS POLICIES
-- ============================================
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to own orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- ORDER_EVENTS POLICIES
-- ============================================
CREATE POLICY "Users can view events for own orders"
  ON order_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_events.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- PAYMENTS POLICIES
-- ============================================
CREATE POLICY "Users can view payments for own orders"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = payments.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- UPLOADS POLICIES
-- ============================================
CREATE POLICY "Users can view own uploads"
  ON uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads"
  ON uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- ADMIN POLICIES (requires custom claim)
-- ============================================
-- Note: Set up admin role via Supabase dashboard or custom claims
-- Example: user metadata { "role": "admin" }

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can update all orders"
  ON orders FOR UPDATE
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can view all order events"
  ON order_events FOR SELECT
  USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admins can insert order events"
  ON order_events FOR INSERT
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

-- ============================================
-- EDGE FUNCTION POLICIES (service_role bypass)
-- ============================================
-- Edge functions use service_role key which bypasses RLS
-- No additional policies needed - they have full access

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (actual pricing from Doc JS Laundry)
-- ============================================
INSERT INTO services (key, name, base_price_cents, unit, description) VALUES
  -- Regular Wash & Iron
  ('shirt_polo', 'Shirt / Polo', 90000, 'piece', 'Short sleeve shirt or polo'),
  ('shirt_long', 'Shirt (Long/Short Sleeve)', 130000, 'piece', 'Long sleeve shirt'),
  ('trouser', 'Trousers / Jeans', 120000, 'piece', 'Trousers or jeans wash and iron'),
  ('native_senator', 'Native (Senator/2pc)', 220000, 'piece', 'Senator or 2-piece native'),
  ('agbada', 'Agbada (3-Piece)', 350000, 'piece', '3-piece Agbada'),
  ('bedsheet_double', 'Bedsheet (Double)', 180000, 'piece', 'Double bedsheet'),
  
  -- Premium Care / Dry Cleaning
  ('suit_2pc', 'Suit (2-Piece)', 300000, 'piece', '2-piece suit dry clean'),
  ('blazer', 'Blazer / Jacket', 180000, 'piece', 'Blazer or jacket dry clean'),
  ('kaftan', 'Kaftan / Jalabiya', 250000, 'piece', 'Kaftan or Jalabiya'),
  ('evening_gown', 'Evening Gown', 350000, 'piece', 'Evening gown dry clean'),
  ('tie_scarf', 'Tie / Scarf', 50000, 'piece', 'Tie or scarf'),
  
  -- Special Services
  ('wedding_gown', 'Wedding Gown (Basic)', 1200000, 'piece', 'Basic wedding gown cleaning'),
  ('duvet_large', 'Duvet (Large)', 400000, 'piece', 'Large duvet cleaning'),
  ('rug_cleaning', 'Rug Cleaning', 80000, 'sqm', 'Rug cleaning per square meter'),
  
  -- Modifiers (not items, but for reference)
  ('express_same_day', 'Express (Same Day)', 0, 'modifier', 'Same day service +50% surcharge');

-- ============================================
-- TEST QUERIES (RLS validation)
-- ============================================
-- Run these as different users to test RLS

-- Test 1: User can only see their own orders
-- SELECT * FROM orders; -- Should only return orders where user_id = auth.uid()

-- Test 2: User cannot see other users' orders
-- SELECT * FROM orders WHERE user_id != auth.uid(); -- Should return empty

-- Test 3: User can view active services
-- SELECT * FROM services WHERE is_active = TRUE; -- Should work for all users

-- Test 4: Admin can see all orders (requires admin role in user_metadata)
-- SELECT * FROM orders; -- Should return all orders if user has admin role

-- Test 5: User can only insert orders for themselves
-- INSERT INTO orders (user_id, address_id, total_cents) 
-- VALUES ('other-user-id', 'some-address-id', 10000); -- Should fail
