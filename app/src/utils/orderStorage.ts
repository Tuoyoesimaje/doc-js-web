import type { ParsedOrderItem, LogisticsOption, PaymentMethod } from '../types'

export interface GuestOrderData {
  items: ParsedOrderItem[]
  expressService: boolean
  logisticsOption: LogisticsOption
  paymentMethod: PaymentMethod
  address: {
    street: string
    city: string
    state: string
    phone: string
  }
  timestamp: number
}

const STORAGE_KEY = 'docjs_guest_order'

export const saveGuestOrder = (order: GuestOrderData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order))
  } catch (error) {
    console.error('Failed to save guest order:', error)
  }
}

export const getGuestOrder = (): GuestOrderData | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const order = JSON.parse(stored) as GuestOrderData
    
    // Check if order is less than 24 hours old
    const hoursSinceCreation = (Date.now() - order.timestamp) / (1000 * 60 * 60)
    if (hoursSinceCreation > 24) {
      clearGuestOrder()
      return null
    }
    
    return order
  } catch (error) {
    console.error('Failed to retrieve guest order:', error)
    return null
  }
}

export const clearGuestOrder = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear guest order:', error)
  }
}
