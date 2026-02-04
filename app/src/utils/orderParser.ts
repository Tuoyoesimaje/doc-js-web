import type { ParsedOrderItem } from '../types'

/**
 * Enhanced order parser with better accuracy and fuzzy matching
 * Examples:
 * - "10 shirts, 5 trousers"
 * - "2 suits, 1 wedding gown"
 * - "3x polo shirts"
 * - "5 jeans and 2 bedsheets"
 */

const SERVICE_KEYWORDS: Record<string, { keywords: string[], priority: number }> = {
  // Specific items get higher priority
  wedding_gown: { 
    keywords: ['wedding gown', 'wedding dress', 'bridal gown', 'bridal dress', 'bride gown'], 
    priority: 10 
  },
  evening_gown: { 
    keywords: ['evening gown', 'evening dress', 'dinner gown', 'formal gown'], 
    priority: 9 
  },
  agbada: { 
    keywords: ['agbada', '3-piece', '3 piece', 'three piece', 'complete agbada'], 
    priority: 8 
  },
  native_senator: { 
    keywords: ['native', 'senator', '2pc native', '2-piece native', '2 piece native', 'senator wear'], 
    priority: 8 
  },
  suit_2pc: { 
    keywords: ['suit', 'suits', '2-piece suit', '2 piece suit', 'two piece suit', 'formal suit'], 
    priority: 7 
  },
  kaftan: { 
    keywords: ['kaftan', 'jalabiya', 'kaftans', 'jalabias', 'caftan'], 
    priority: 7 
  },
  blazer: { 
    keywords: ['blazer', 'jacket', 'blazers', 'jackets', 'sport coat', 'sports jacket'], 
    priority: 6 
  },
  shirt_long: { 
    keywords: ['long sleeve', 'long-sleeve', 'longsleeve', 'long sleeve shirt', 'formal shirt'], 
    priority: 5 
  },
  shirt_polo: { 
    keywords: ['shirt', 'polo', 'shirts', 'polos', 't-shirt', 'tshirt', 'tee', 'top'], 
    priority: 4 
  },
  trouser: { 
    keywords: ['trouser', 'trousers', 'jeans', 'jean', 'pant', 'pants', 'slacks', 'chinos'], 
    priority: 4 
  },
  bedsheet_double: { 
    keywords: ['bedsheet', 'bed sheet', 'sheets', 'bed sheets', 'linen', 'bedding'], 
    priority: 6 
  },
  duvet_large: { 
    keywords: ['duvet', 'duvets', 'comforter', 'comforters', 'blanket', 'quilt'], 
    priority: 6 
  },
  rug_cleaning: { 
    keywords: ['rug', 'rugs', 'carpet', 'carpets', 'mat', 'mats'], 
    priority: 6 
  },
  tie_scarf: { 
    keywords: ['tie', 'scarf', 'ties', 'scarves', 'necktie', 'bow tie'], 
    priority: 3 
  },
}

export function parseBulkOrder(input: string): ParsedOrderItem[] {
  const items: ParsedOrderItem[] = []
  
  // Split by common separators: comma, newline, "and"
  const lines = input
    .split(/[,\n]|(?:\s+and\s+)/i)
    .map(line => line.trim())
    .filter(Boolean)

  for (const line of lines) {
    const parsed = parseOrderLine(line)
    if (parsed) {
      // Check if we already have this service, if so, add to quantity
      const existing = items.find(item => item.service_key === parsed.service_key)
      if (existing) {
        existing.quantity += parsed.quantity
        existing.text += `, ${parsed.text}`
      } else {
        items.push(parsed)
      }
    }
  }

  return items
}

function parseOrderLine(line: string): ParsedOrderItem | null {
  // Match various quantity patterns:
  // "10 shirts", "5x trousers", "2 * suits", "three jeans"
  const patterns = [
    /^(\d+)\s*x?\s*(.+)$/i,           // "10 shirts" or "10x shirts"
    /^(\d+)\s*\*\s*(.+)$/i,           // "10 * shirts"
    /^(one|two|three|four|five|six|seven|eight|nine|ten)\s+(.+)$/i, // "five shirts"
  ]

  let quantity = 1
  let itemText = line.toLowerCase().trim()

  // Try to extract quantity
  for (const pattern of patterns) {
    const match = line.match(pattern)
    if (match) {
      const qtyStr = match[1].toLowerCase()
      
      // Convert word numbers to digits
      const wordNumbers: Record<string, number> = {
        'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
        'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
      }
      
      quantity = wordNumbers[qtyStr] || parseInt(qtyStr, 10)
      itemText = match[2].toLowerCase().trim()
      break
    }
  }

  // Find best matching service using priority-based matching
  let bestMatch: { key: string, score: number } | null = null

  for (const [serviceKey, config] of Object.entries(SERVICE_KEYWORDS)) {
    for (const keyword of config.keywords) {
      // Exact match gets highest score
      if (itemText === keyword) {
        return {
          service_key: serviceKey,
          quantity,
          text: line,
        }
      }

      // Contains match with priority weighting
      if (itemText.includes(keyword)) {
        const score = config.priority + (keyword.length / itemText.length) * 10
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { key: serviceKey, score }
        }
      }
    }
  }

  if (bestMatch) {
    return {
      service_key: bestMatch.key,
      quantity,
      text: line,
    }
  }

  // If no match found, return null (don't default to anything)
  return null
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

/**
 * Get service name from key
 */
export function getServiceName(serviceKey: string): string {
  const names: Record<string, string> = {
    shirt_polo: 'Shirt / Polo',
    shirt_long: 'Shirt (Long Sleeve)',
    trouser: 'Trousers / Jeans',
    native_senator: 'Native (Senator/2pc)',
    agbada: 'Agbada (3-Piece)',
    bedsheet_double: 'Bedsheet (Double)',
    suit_2pc: 'Suit (2-Piece)',
    blazer: 'Blazer / Jacket',
    kaftan: 'Kaftan / Jalabiya',
    evening_gown: 'Evening Gown',
    tie_scarf: 'Tie / Scarf',
    wedding_gown: 'Wedding Gown (Basic)',
    duvet_large: 'Duvet (Large)',
    rug_cleaning: 'Rug Cleaning',
  }
  return names[serviceKey] || serviceKey
}
