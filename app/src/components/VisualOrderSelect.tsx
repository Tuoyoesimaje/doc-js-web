import { useState } from 'react'
import type { Service, ParsedOrderItem } from '../types'

interface VisualOrderSelectProps {
  services: Service[]
  onChange: (items: ParsedOrderItem[]) => void
}

export default function VisualOrderSelect({ services, onChange }: VisualOrderSelectProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({})

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
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-gray-700 mb-4">
        Select Items & Quantities
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((service) => (
          <div 
            key={service.id} 
            className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5 hover:border-primary-600 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{service.name}</h4>
                <p className="text-sm text-primary-600 font-bold">
                  ₦{(service.base_price_cents / 100).toLocaleString()} / {service.unit}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(service.key, (quantities[service.key] || 0) - 1)}
                className="w-10 h-10 rounded-xl bg-white border-2 border-gray-300 hover:border-primary-600 hover:bg-primary-50 flex items-center justify-center transition-all duration-200 font-bold text-gray-700"
              >
                −
              </button>
              <input
                type="number"
                min="0"
                value={quantities[service.key] || 0}
                onChange={(e) => handleQuantityChange(service.key, parseInt(e.target.value) || 0)}
                className="flex-1 text-center border-2 border-gray-300 rounded-xl py-2.5 font-bold text-lg focus:border-primary-600 focus:ring-2 focus:ring-primary-100 outline-none transition-all duration-200"
              />
              <button
                onClick={() => handleQuantityChange(service.key, (quantities[service.key] || 0) + 1)}
                className="w-10 h-10 rounded-xl bg-white border-2 border-gray-300 hover:border-primary-600 hover:bg-primary-50 flex items-center justify-center transition-all duration-200 font-bold text-gray-700"
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
