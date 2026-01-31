import type { ParsedOrderItem } from '../types'

/**
 * Parse bulk order text input into structured items
 * Examples:
 * - "10 shirts, 5 trousers"
 * - "2 suits, 1 wedding gown"
 * - "wash 50 clothes" (generic)
 */

const SERVICE_KEYWORDS: Record<string, string[]> = {
  shirt_polo: ['shirt', 'polo', 'shirts', 'polos'],
  shirt_long: ['long sleeve', 'long-sleeve', 'longsleeve'],
  trouser: ['trouser', 'trousers', 'jeans', 'jean', 'pant', 'pants'],
  native_senator: ['native', 'senator', '2pc', '2-piece native'],
  agbada: ['agbada', '3-piece', '3pc'],
  bedsheet_double: ['bedsheet', 'bed sheet', 'sheets'],
  suit_2pc: ['suit', 'suits', '2-piece suit'],
  blazer: ['blazer', 'jacket', 'blazers', 'jackets'],
  kaftan: ['kaftan', 'jalabiya', 'kaftans'],
  evening_gown: ['evening gown', 'gown', 'gowns'],
  tie_scarf: ['tie', 'scarf', 'ties', 'scarves'],
  wedding_gown: ['wedding gown', 'wedding dress', 'bridal gown'],
  duvet_large: ['duvet', 'duvets', 'comforter'],
  rug_cleaning: ['rug', 'rugs', 'carpet', 'carpets'],
}

export function parseBulkOrder(input: string): ParsedOrderItem[] {
  const items: ParsedOrderItem[] = []
  const lines = input.split(/[,\n]/).map(line => line.trim()).filter(Boolean)

  for (const line of lines) {
    const parsed = parseOrderLine(line)
    if (parsed) {
      items.push(parsed)
    }
  }

  return items
}

function parseOrderLine(line: string): ParsedOrderItem | null {
  // Match patterns like "10 shirts", "5 trousers", "2 wedding gowns"
  const quantityMatch = line.match(/^(\d+)\s+(.+)$/i)
  
  if (!quantityMatch) {
    return null
  }

  const quantity = parseInt(quantityMatch[1], 10)
  const itemText = quantityMatch[2].toLowerCase().trim()

  // Find matching service
  for (const [serviceKey, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (itemText.includes(keyword)) {
        return {
          service_key: serviceKey,
          quantity,
          text: line,
        }
      }
    }
  }

  // If no match, return generic item
  return {
    service_key: 'shirt_polo', // default fallback
    quantity,
    text: line,
  }
}

/**
 * Calculate total price for parsed items
 */
export function calculateTotal(
  items: ParsedOrderItem[],
  services: Record<string, number>,
  expressService: boolean = false
): number {
  let total = 0

  for (const item of items) {
    const basePrice = services[item.service_key] || 0
    total += basePrice * item.quantity
  }

  // Apply express surcharge (+50%)
  if (expressService) {
    total = Math.round(total * 1.5)
  }

  return total
}
