import { useState } from 'react'
import type { Service, ParsedOrderItem } from '../types'

interface VisualOrderSelectProps {
  services: Service[]
  onChange: (items: ParsedOrderItem[]) => void
}

export default function VisualOrderSelect({ services, onChange }: VisualOrderSelectProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  // Sort services: essentials first (tshirt, trouser), then alphabetically
  const sortedServices = [...services].sort((a, b) => {
    const essentials = ['tshirt', 'trouser', 'shirt', 'jeans']
    const aIsEssential = essentials.includes(a.key.toLowerCase())
    const bIsEssential = essentials.includes(b.key.toLowerCase())
    
    if (aIsEssential && !bIsEssential) return -1
    if (!aIsEssential && bIsEssential) return 1
    
    // If both essential or both not, sort by order in essentials array or alphabetically
    if (aIsEssential && bIsEssential) {
      return essentials.indexOf(a.key.toLowerCase()) - essentials.indexOf(b.key.toLowerCase())
    }
    
    return a.name.localeCompare(b.name)
  })

  const handleQuantityChange = (serviceKey: string, quantity: number) => {
    const newQuantities = { ...quantities, [serviceKey]: Math.max(0, quantity) }
    setQuantities(newQuantities)

    const newItems: ParsedOrderItem[] = Object.entries(newQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([key, qty]) => {
        const service = services.find(s => s.key === key)
        return {
          service_key: key,
          quantity: qty,
          text: `${qty} ${service?.name || key}`,
          unit_price_cents: service?.base_price_cents,
        }
      })

    onChange(newItems)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {sortedServices.map((service) => (
          <div 
            key={service.id} 
            className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 hover:border-primary-600 transition-all duration-200"
          >
            <div className="mb-2">
              <h4 className="font-semibold text-gray-900 text-sm mb-0.5">{service.name}</h4>
              <p className="text-xs text-primary-600 font-bold">
                ₦{(service.base_price_cents / 100).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(service.key, (quantities[service.key] || 0) - 1)}
                className="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 hover:border-primary-600 hover:bg-primary-50 flex items-center justify-center transition-all duration-200 font-bold text-gray-700 text-sm"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                value={quantities[service.key] || 0}
                onChange={(e) => handleQuantityChange(service.key, parseInt(e.target.value) || 0)}
                className="flex-1 text-center border-2 border-gray-300 rounded-lg py-1.5 font-bold text-base focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none transition-all duration-200"
              />
              <button
                onClick={() => handleQuantityChange(service.key, (quantities[service.key] || 0) + 1)}
                className="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 hover:border-primary-600 hover:bg-primary-50 flex items-center justify-center transition-all duration-200 font-bold text-gray-700 text-sm"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
