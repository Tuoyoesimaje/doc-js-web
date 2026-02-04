-- ============================================
-- SUPPORT CHAT SYSTEM & ADMIN SECURITY
-- ============================================

-- Add admin role columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_admin_login TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_user_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE email = user_email 
    AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE YOUR FIRST ADMIN USER
-- ============================================
-- Run this after migration, replacing with your email:
-- UPDATE users SET is_admin = TRUE, role = 'admin' WHERE email = 'your@email.com';

-- Messages table for customer support
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  read_by_user BOOLEAN DEFAULT FALSE,
  read_by_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (drop first if they exist to avoid errors)
DROP INDEX IF EXISTS idx_support_messages_user_id;
DROP INDEX IF EXISTS idx_support_messages_order_id;
DROP INDEX IF EXISTS idx_support_messages_created_at;

CREATE INDEX idx_support_messages_user_id ON support_messages(user_id);
CREATE INDEX idx_support_messages_order_id ON support_messages(order_id);
CREATE INDEX idx_support_messages_created_at ON support_messages(created_at DESC);

-- Enable RLS
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own messages" ON support_messages;
DROP POLICY IF EXISTS "Users can send messages" ON support_messages;
DROP POLICY IF EXISTS "Users can update own messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can view all messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can send messages" ON support_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON support_messages;
DROP POLICY IF EXISTS "Only admins can update roles" ON users;

-- Users can view their own messages
CREATE POLICY "Users can view own messages"
  ON support_messages FOR SELECT
  USING (user_id = auth.uid());

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON support_messages FOR INSERT
  WITH CHECK (
    user_id = auth.uid() 
    AND is_admin = FALSE
  );

-- Users can mark their messages as read
CREATE POLICY "Users can update own messages"
  ON support_messages FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON support_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = TRUE
    )
  );

-- Admins can send messages
CREATE POLICY "Admins can send messages"
  ON support_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = TRUE
    )
  );

-- Admins can update messages
CREATE POLICY "Admins can update messages"
  ON support_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.is_admin = TRUE
    )
  );

-- ============================================
-- ADMIN ROLE POLICIES
-- ============================================

-- Only admins can update user roles
CREATE POLICY "Only admins can update roles"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users AS admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users AS admin_check
      WHERE admin_check.id = auth.uid() 
      AND admin_check.is_admin = TRUE
    )
  );

-- ============================================
-- FUNCTION TO CHECK UNREAD MESSAGES
-- ============================================

CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM support_messages
    WHERE user_id = p_user_id
    AND is_admin = TRUE
    AND read_by_user = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next step: Create your first admin user with:
-- UPDATE users SET is_admin = TRUE, role = 'admin' WHERE email = 'your@email.com';
