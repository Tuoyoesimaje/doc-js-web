import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { parseBulkOrder, calculateTotal } from '../utils/orderParser'
import type { Service, Address, ParsedOrderItem } from '../types'
import Button from '../components/Button'
import QuickOrderInput from '../components/QuickOrderInput'
import VisualOrderSelect from '../components/VisualOrderSelect'
import AddressPicker from '../components/AddressPicker'
import AddAddressModal from '../components/AddAddressModal'

type OrderMode = 'quick' | 'visual'

export default function NewOrderPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [mode, setMode] = useState<OrderMode>('quick')
  const [services, setServices] = useState<Service[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [items, setItems] = useState<ParsedOrderItem[]>([])
  const [expressService, setExpressService] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showAddAddressModal, setShowAddAddressModal] = useState(false)

  useEffect(() => {
    loadServices()
    loadAddresses()
  }, [])

  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (data) setServices(data)
  }

  const loadAddresses = async () => {
    const { data } = await supabase
      .from('addresses')
      .select('*')
      .order('is_default', { ascending: false })
    
    if (data) {
      setAddresses(data)
      const defaultAddr = data.find(a => a.is_default)
      if (defaultAddr) setSelectedAddress(defaultAddr)
    }
  }

  const handleQuickOrderParse = (text: string) => {
    const parsed = parseBulkOrder(text)
    setItems(parsed)
  }

  const handleVisualOrderChange = (items: ParsedOrderItem[]) => {
    setItems(items)
  }

  const calculateOrderTotal = () => {
    const serviceMap = services.reduce((acc, s) => {
      acc[s.key] = s.base_price_cents
      return acc
    }, {} as Record<string, number>)
    
    return calculateTotal(items, serviceMap, expressService)
  }

  const handleSubmitOrder = async () => {
    if (!selectedAddress || items.length === 0) {
      alert('Please select an address and add items')
      return
    }

    setLoading(true)
    try {
      const total = calculateOrderTotal()

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          address_id: selectedAddress.id,
          total_cents: total,
          status: 'received',
          payment_status: 'pending',
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = items.map(item => {
        const service = services.find(s => s.key === item.service_key)
        return {
          order_id: order.id,
          service_id: service?.id,
          description: item.text,
          quantity: item.quantity,
          unit_price_cents: service?.base_price_cents || 0,
          modifiers: expressService ? { express: true } : {},
        }
      })

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      await supabase.from('order_events').insert({
        order_id: order.id,
        event_type: 'created',
        note: 'Order created',
      })

      navigate(`/orders/${order.id}`)
    } catch (error) {
      console.error('Failed to create order:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const total = calculateOrderTotal()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b-2 border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-2xl font-display font-bold text-gray-900">New Order</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 font-medium">Total</p>
              <p className="text-2xl font-display font-bold text-primary-600">
                ₦{(total / 100).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">1</div>
              <span className="text-sm font-semibold text-gray-900">Address</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">2</div>
              <span className="text-sm font-semibold text-gray-900">Items</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold text-sm">3</div>
              <span className="text-sm font-medium text-gray-500">Payment</span>
            </div>
          </motion.div>

          {/* Address Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="12" cy="9" r="2.5" stroke="#2563eb" strokeWidth="2"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Delivery Address</h2>
                <p className="text-sm text-gray-600">Where should we deliver your order?</p>
              </div>
            </div>
            <AddressPicker
              addresses={addresses}
              selected={selectedAddress}
              onSelect={setSelectedAddress}
              onAddNew={() => setShowAddAddressModal(true)}
            />
          </motion.div>

          {/* Order Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="7" width="14" height="13" rx="2" stroke="#10b981" strokeWidth="2"/>
                  <path d="M8 5v4M16 5v4" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="10" cy="14" r="1.5" fill="#10b981"/>
                  <circle cx="14" cy="14" r="1.5" fill="#10b981"/>
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-gray-900">Add Items</h2>
                <p className="text-sm text-gray-600">Choose your preferred input method</p>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setMode('quick')}
                className={`flex-1 py-4 px-6 rounded-2xl font-semibold transition-all duration-200 ${
                  mode === 'quick'
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M3 6h14M3 10h14M3 14h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Quick Input
                </div>
              </button>
              <button
                onClick={() => setMode('visual')}
                className={`flex-1 py-4 px-6 rounded-2xl font-semibold transition-all duration-200 ${
                  mode === 'visual'
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                    <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Visual Select
                </div>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'quick' ? (
                <motion.div
                  key="quick"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <QuickOrderInput onParse={handleQuickOrderParse} />
                </motion.div>
              ) : (
                <motion.div
                  key="visual"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <VisualOrderSelect
                    services={services}
                    onChange={handleVisualOrderChange}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Express Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg"
          >
            <label className="flex items-center gap-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={expressService}
                onChange={(e) => setExpressService(e.target.checked)}
                className="w-6 h-6 text-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-warning-600">
                    <path d="M10 2L12 7l5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1 2-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                  </svg>
                  <span className="font-display font-bold text-gray-900">Express Service (Same Day)</span>
                </div>
                <p className="text-sm text-gray-600">Get your clothes back within 24 hours • +50% surcharge</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-warning-600">+50%</span>
              </div>
            </label>
          </motion.div>

          {/* Order Summary */}
          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 shadow-2xl text-white"
              >
                <h3 className="text-xl font-display font-bold mb-6">Order Summary</h3>
                <div className="space-y-3 mb-6">
                  {items.map((item, idx) => {
                    const service = services.find(s => s.key === item.service_key)
                    const itemTotal = (service?.base_price_cents || 0) * item.quantity
                    return (
                      <div key={idx} className="flex justify-between items-center text-primary-50">
                        <span className="font-medium">{item.text}</span>
                        <span className="font-bold">₦{(itemTotal / 100).toLocaleString()}</span>
                      </div>
                    )
                  })}
                  {expressService && (
                    <div className="flex justify-between items-center text-warning-200 pt-3 border-t border-primary-500">
                      <span className="font-medium">Express Service (+50%)</span>
                      <span className="font-bold">₦{((total - total / 1.5) / 100).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div className="border-t-2 border-primary-500 pt-6 flex justify-between items-center">
                  <span className="text-2xl font-display font-bold">Total</span>
                  <span className="text-4xl font-display font-bold">₦{(total / 100).toLocaleString()}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              onClick={handleSubmitOrder}
              loading={loading}
              disabled={!selectedAddress || items.length === 0}
              fullWidth
              size="lg"
              className="shadow-2xl"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Continue to Payment
            </Button>
          </motion.div>
        </div>
      </main>

      {/* Add Address Modal */}
      <AddAddressModal
        isOpen={showAddAddressModal}
        onClose={() => setShowAddAddressModal(false)}
        onSuccess={loadAddresses}
      />
    </div>
  )
}
