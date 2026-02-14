export type OrderStatus = 'received' | 'processing' | 'ready' | 'delivered'
export type PaymentStatus = 'pending' | 'confirmed' | 'failed' | 'refunded'
export type LogisticsOption = 'none' | 'pickup' | 'pickup_delivery'
export type PaymentMethod = 'prepay' | 'postpay'
export type GarmentTagStatus = 'received' | 'processing' | 'ready' | 'delivered'

export interface User {
  id: string
  email?: string
  phone?: string
  display_name?: string
  password_set: boolean
  created_at: string
}

export interface Address {
  id: string
  user_id: string
  label: string
  line1: string
  line2?: string
  city: string
  state: string
  lat?: number
  lng?: number
  is_default: boolean
}

export interface Service {
  id: string
  key: string
  name: string
  base_price_cents: number
  unit: string
  description?: string
  is_active: boolean
}

export interface Order {
  id: string
  user_id: string
  address_id: string
  total_cents: number
  currency: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  pickup_fee_paid: boolean
  final_payment_pending: boolean
  logistics_option: LogisticsOption
  logistics_fee_cents: number
  notes?: string
  created_at: string
  updated_at: string
  address?: Address
  items?: OrderItem[]
  user?: {
    display_name?: string
    email?: string
    phone?: string
  }
}

export interface OrderItem {
  id: string
  order_id: string
  service_id?: string
  description: string
  quantity: number
  unit_price_cents: number
  modifiers?: Record<string, any>
  service?: Service
}

export interface OrderEvent {
  id: string
  order_id: string
  event_type: string
  note?: string
  created_at: string
}

export interface ParsedOrderItem {
  service_key: string
  quantity: number
  text: string
  unit_price_cents?: number
}

export interface GarmentTag {
  id: string
  tag_number: string
  order_id: string
  order_item_id?: string
  service_name: string
  customer_name?: string
  customer_phone?: string
  status: GarmentTagStatus
  notes?: string
  created_at: string
  updated_at: string
}
