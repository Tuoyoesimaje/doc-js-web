-- =============================================
-- GARMENT TAGGING SYSTEM MIGRATION
-- =============================================
-- This migration adds the ability to track individual
-- clothing items with unique tag numbers (DJS-YYMMDD-XXXX)
-- =============================================

-- Create garment_tags table
CREATE TABLE IF NOT EXISTS garment_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_number TEXT UNIQUE NOT NULL, -- e.g., "DJS-250115-0001"
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'received', -- received, processing, ready, delivered
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_garment_tags_tag_number ON garment_tags(tag_number);
CREATE INDEX IF NOT EXISTS idx_garment_tags_order_id ON garment_tags(order_id);
CREATE INDEX IF NOT EXISTS idx_garment_tags_status ON garment_tags(status);
CREATE INDEX IF NOT EXISTS idx_garment_tags_created_at ON garment_tags(created_at);

-- Add garment_tag_id to order_items (optional - for linking)
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS garment_tag_id UUID REFERENCES garment_tags(id);

-- Create function to generate next tag number for a given date
CREATE OR REPLACE FUNCTION generate_tag_number(tag_date DATE DEFAULT CURRENT_DATE)
RETURNS TEXT AS $$
DECLARE
  date_part TEXT;
  sequence_num INTEGER;
  tag_num TEXT;
BEGIN
  -- Format date as YYMMDD
  date_part := TO_CHAR(tag_date, 'YYMMDD');
  
  -- Get the next sequence number for this date
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(tag_number FROM 'DJS-[0-9]{6}-([0-9]{4})') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM garment_tags
  WHERE tag_number LIKE 'DJS-' || date_part || '-%';
  
  -- Format as DJS-YYMMDD-XXXX
  tag_num := 'DJS-' || date_part || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN tag_num;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_garment_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_garment_tags_updated_at ON garment_tags;
CREATE TRIGGER trigger_update_garment_tags_updated_at
  BEFORE UPDATE ON garment_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_garment_tags_updated_at();

-- RLS Policies for garment_tags
ALTER TABLE garment_tags ENABLE ROW LEVEL SECURITY;

-- Users can view their own garment tags
CREATE POLICY "Users can view their own garment tags"
  ON garment_tags FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

-- Admins can view all garment tags
CREATE POLICY "Admins can view all garment tags"
  ON garment_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- Admins can insert garment tags
CREATE POLICY "Admins can insert garment tags"
  ON garment_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- Admins can update garment tags
CREATE POLICY "Admins can update garment tags"
  ON garment_tags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- Admins can delete garment tags
CREATE POLICY "Admins can delete garment tags"
  ON garment_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (is_admin = true OR role = 'admin')
    )
  );

-- =============================================
-- EXAMPLE USAGE
-- =============================================
-- Generate a tag number for today:
-- SELECT generate_tag_number();
-- Result: DJS-250115-0001

-- Generate a tag number for a specific date:
-- SELECT generate_tag_number('2025-01-20');
-- Result: DJS-250120-0001

-- Create a garment tag:
-- INSERT INTO garment_tags (tag_number, order_id, order_item_id, service_name, customer_name, customer_phone)
-- VALUES (generate_tag_number(), 'order-uuid', 'item-uuid', 'Shirt', 'John Doe', '08012345678');

-- Search by tag number:
-- SELECT * FROM garment_tags WHERE tag_number = 'DJS-250115-0001';

-- Get all tags for an order:
-- SELECT * FROM garment_tags WHERE order_id = 'order-uuid';

-- Update tag status:
-- UPDATE garment_tags SET status = 'processing' WHERE tag_number = 'DJS-250115-0001';
