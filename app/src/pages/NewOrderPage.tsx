import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import { parseBulkOrder, calculateTotal } from '../utils/orderParser'
import { getGuestOrder, clearGuestOrder } from '../utils/orderStorage'
import type { Service, Address, ParsedOrderItem, LogisticsOption, PaymentMethod } from '../types'
import Button from '../components/Button'
import QuickOrderInput from '../components/QuickOrderInput'
import VisualOrderSelect from '../components/VisualOrderSelect'
import AddressPicker from '../components/AddressPicker'
import AddAddressModal from '../components/AddAddressModal'

type OrderMode = 'quick' | 'visual'

const LOGISTICS_OPTIONS = {
  none: { label: 'Self Drop-off', fee: 0, description: 'Bring to our shop yourself' },
  pickup: { label: 'Pickup Only', fee: 200000, description: 'We pick up, you collect from shop' },
  pickup_delivery: { label: 'Pickup & Delivery', fee: 400000, description: 'Full door-to-door service' },
}

export default function NewOrderPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthStore()
  const [mode, setMode] = useState<OrderMode>('quick')
  const [services, setServices] = useState<Service[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [items, setItems] = useState<ParsedOrderItem[]>([])
  const [expressService, setExpressService] = useState(false)
  const [logisticsOption, setLogisticsOption] = useState<LogisticsOption>('none')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('postpay')
  const [loading, setLoading] = useState(false)
  const [showAddAddressModal, setShowAddAddressModal] = useState(false)

  useEffect(() => {
    loadServices()
    loadAddresses()
    checkForGuestOrder()
  }, [location.pathname])

  const checkForGuestOrder = async () => {
    const guestOrder = getGuestOrder()
    if (guestOrder && user) {
      // User just signed up from guest checkout
      // Create address and order automatically
      try {
        // Create address
        const { data: newAddress, error: addressError } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            street: guestOrder.address.street,
            city: guestOrder.address.city,
            state: guestOrder.address.state,
            phone: guestOrder.address.phone,
            is_default: true,
          })
          .select()
          .single()

        if (addressError) throw addressError

        // Set the order details from guest order
        setItems(guestOrder.items)
        setExpressService(guestOrder.expressService)
        setLogisticsOption(guestOrder.logisticsOption)
        setPaymentMethod(guestOrder.paymentMethod)
        setSelectedAddress(newAddress)

        // Clear guest order from storage
        clearGuestOrder()

        // Show success message
        console.log('Guest order loaded successfully')
      } catch (error) {
        console.error('Failed to load guest order:', error)
      }
    }
  }

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
    
    const itemsTotal = calculateTotal(items, serviceMap, expressService)
    const logisticsFee = LOGISTICS_OPTIONS[logisticsOption].fee
    
    return itemsTotal + logisticsFee
  }

  const getItemsTotal = () => {
    const serviceMap = services.reduce((acc, s) => {
      acc[s.key] = s.base_price_cents
      return acc
    }, {} as Record<string, number>)
    
    return calculateTotal(items, serviceMap, expressService)
  }

  const getDiscountedTotal = () => {
    // 2% discount only on laundry items, not logistics
    const itemsTotal = getItemsTotal()
    const discountedItems = Math.floor(itemsTotal * 0.98)
    const logisticsFee = LOGISTICS_OPTIONS[logisticsOption].fee
    
    return discountedItems + logisticsFee
  }

  const getPaymentAmount = () => {
    if (paymentMethod === 'prepay') {
      return getDiscountedTotal() // Discounted items + full logistics fee
    } else {
      // Postpay: only pickup fee if logistics selected, otherwise full amount
      if (logisticsOption === 'pickup' || logisticsOption === 'pickup_delivery') {
        return 200000 // ₦2,000 pickup fee
      }
      return calculateOrderTotal() // If no logistics, must pay full (they're bringing to shop)
    }
  }

  const getRemainingAmount = () => {
    const total = paymentMethod === 'prepay' ? getDiscountedTotal() : calculateOrderTotal()
    const paid = getPaymentAmount()
    return total - paid
  }

  const handleSubmitOrder = async () => {
    if (!selectedAddress || items.length === 0) {
      alert('Please select an address and add items')
      return
    }

    setLoading(true)
    try {
      const total = paymentMethod === 'prepay' ? getDiscountedTotal() : calculateOrderTotal()

      console.log('Creating order with:', {
        total,
        paymentMethod,
        logisticsOption,
        itemsCount: items.length
      })

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          address_id: selectedAddress.id,
          total_cents: total,
          status: 'received',
          payment_status: 'pending',
          payment_method: paymentMethod,
          pickup_fee_paid: false, // Always false initially - payment happens on order detail page
          final_payment_pending: paymentMethod === 'postpay' && (logisticsOption === 'pickup' || logisticsOption === 'pickup_delivery'),
          logistics_option: logisticsOption,
          logistics_fee_cents: LOGISTICS_OPTIONS[logisticsOption].fee,
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw orderError
      }

      console.log('Order created:', order.id)

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

      if (itemsError) {
        console.error('Order items error:', itemsError)
        throw itemsError
      }

      // Try to create event, but don't fail if it doesn't work (RLS issue)
      try {
        await supabase.from('order_events').insert({
          order_id: order.id,
          event_type: 'created',
          note: 'Order created',
        })
      } catch (eventError) {
        console.warn('Failed to create order event (non-critical):', eventError)
      }

      console.log('Navigating to order:', order.id)
      navigate(`/orders/${order.id}`)
    } catch (error) {
      console.error('Failed to create order:', error)
      alert(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  const total = calculateOrderTotal()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b-2 border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">New Order</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {paymentMethod === 'postpay' && getRemainingAmount() > 0 ? 'Pay Now' : 'Total'}
              </p>
              <p className="text-2xl font-display font-bold text-primary-600 dark:text-primary-400">
                ₦{items.length === 0 ? '0' : (getPaymentAmount() / 100).toLocaleString()}
              </p>
              {paymentMethod === 'postpay' && getRemainingAmount() > 0 && items.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  +₦{(getRemainingAmount() / 100).toLocaleString()} later
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Progress Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-4 mb-8"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center font-bold text-sm">1</div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Address</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-600 dark:bg-primary-500 text-white flex items-center justify-center font-bold text-sm">2</div>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Items</span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center font-bold text-sm">3</div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment</span>
            </div>
          </motion.div>

          {/* Address Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2C7 2 4 4 4 7c0 4 6 11 6 11s6-7 6-11c0-3-3-5-6-5z" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="10" cy="7" r="2" stroke="#2563eb" strokeWidth="2"/>
                </svg>
              </div>
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Delivery Address</h2>
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
            className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/30 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="4" y="6" width="12" height="11" rx="2" stroke="#10b981" strokeWidth="2"/>
                  <path d="M7 4v3M13 4v3" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Add Items</h2>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setMode('quick')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  mode === 'quick'
                    ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Quick Input
              </button>
              <button
                onClick={() => setMode('visual')}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  mode === 'visual'
                    ? 'bg-primary-600 dark:bg-primary-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Visual Select
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

          {/* Express Service + Logistics + Payment - Combined */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5 shadow-lg space-y-5"
          >
            {/* Express Service */}
            <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={expressService}
                onChange={(e) => setExpressService(e.target.checked)}
                className="w-5 h-5 text-primary-600 rounded-lg focus:ring-2 focus:ring-primary-500 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">Express Service</span>
                  <span className="text-xs font-bold text-warning-600 dark:text-warning-400">+50%</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Same day delivery</p>
              </div>
            </label>

            <div className="border-t-2 border-gray-100 dark:border-gray-700"></div>

            {/* Logistics */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Logistics</h3>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(LOGISTICS_OPTIONS) as LogisticsOption[]).map((option) => {
                  const config = LOGISTICS_OPTIONS[option]
                  const isSelected = logisticsOption === option
                  return (
                    <label
                      key={option}
                      className={`flex flex-col gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="logistics"
                        value={option}
                        checked={isSelected}
                        onChange={(e) => setLogisticsOption(e.target.value as LogisticsOption)}
                        className="sr-only"
                      />
                      <div className={`text-xs font-bold ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                        {config.label}
                      </div>
                      <div className={`text-sm font-bold ${
                        config.fee === 0 
                          ? 'text-green-600 dark:text-green-400' 
                          : isSelected 
                            ? 'text-primary-600 dark:text-primary-400'
                            : 'text-primary-600 dark:text-primary-300'
                      }`}>
                        {config.fee === 0 ? 'Free' : `₦${(config.fee / 100).toLocaleString()}`}
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>

            <div className="border-t-2 border-gray-100 dark:border-gray-700"></div>

            {/* Payment Method */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Payment</h3>
              <div className="grid grid-cols-2 gap-2">
                {/* Postpay */}
                <label
                  className={`flex flex-col gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'postpay'
                      ? 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="postpay"
                    checked={paymentMethod === 'postpay'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Pay After</span>
                    <span className="px-1.5 py-0.5 bg-green-600 dark:bg-green-500 text-white text-[10px] font-bold rounded">TOP</span>
                  </div>
                  <div className="text-sm font-bold text-green-600 dark:text-green-400">
                    ₦{(getPaymentAmount() / 100).toLocaleString()} now
                  </div>
                  {getRemainingAmount() > 0 && (
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      +₦{(getRemainingAmount() / 100).toLocaleString()} later
                    </div>
                  )}
                </label>

                {/* Prepay */}
                <label
                  className={`flex flex-col gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'prepay'
                      ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="prepay"
                    checked={paymentMethod === 'prepay'}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="sr-only"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">Pay Now</span>
                    <span className="px-1.5 py-0.5 bg-primary-600 dark:bg-primary-500 text-white text-[10px] font-bold rounded">2% OFF</span>
                  </div>
                  <div className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    ₦{(getDiscountedTotal() / 100).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 line-through">
                    ₦{(calculateOrderTotal() / 100).toLocaleString()}
                  </div>
                </label>
              </div>
            </div>
          </motion.div>

          {/* Order Summary */}
          <AnimatePresence>
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white">Order Summary ({items.length})</h3>
                  <button
                    onClick={() => setItems([])}
                    className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <AnimatePresence mode="popLayout">
                    {items.map((item, idx) => {
                      const service = services.find(s => s.key === item.service_key)
                      const itemTotal = (service?.base_price_cents || 0) * item.quantity
                      return (
                        <motion.div
                          key={`${item.service_key}-${idx}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900 dark:text-white">{item.text}</span>
                              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-lg">
                                x{item.quantity}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ₦{((service?.base_price_cents || 0) / 100).toLocaleString()} each
                            </p>
                          </div>
                          <div className="text-right flex items-center gap-3">
                            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                              ₦{(itemTotal / 100).toLocaleString()}
                            </span>
                            <button
                              onClick={() => setItems(items.filter((_, i) => i !== idx))}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                            </button>
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>

                {/* Subtotal and Express */}
                <div className="space-y-2 pb-4 border-b-2 border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-bold">₦{(expressService ? total / 1.5 : total) / 100 | 0}</span>
                  </div>
                  {expressService && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between items-center text-warning-600 dark:text-warning-400"
                    >
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M8 2L9.5 5.5l3.5.5-2.5 2.5.5 3.5L8 10l-3 2 .5-3.5L3 6l3.5-.5L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-medium">Express Service (+50%)</span>
                      </div>
                      <span className="font-bold">₦{((total - total / 1.5) / 100).toLocaleString()}</span>
                    </motion.div>
                  )}
                  {logisticsOption !== 'none' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex justify-between items-center text-blue-600 dark:text-blue-400"
                    >
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M10 12V5c0-.6.4-1 1-1h2c.6 0 1 .4 1 1v7m-4 0H2l1-5h4l1 5zm0 0h4m0 0h1v1c0 .6-.4 1-1 1h-1m-4-2v1c0 .6-.4 1-1 1H8m-2 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm7 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="font-medium">{LOGISTICS_OPTIONS[logisticsOption].label}</span>
                      </div>
                      <span className="font-bold">₦{(LOGISTICS_OPTIONS[logisticsOption].fee / 100).toLocaleString()}</span>
                    </motion.div>
                  )}
                </div>

                {/* Total */}
                <div className="pt-4 flex justify-between items-center">
                  <span className="text-xl font-display font-bold text-gray-900 dark:text-white">Total</span>
                  <motion.span
                    key={total}
                    initial={{ scale: 1.2, color: '#2563eb' }}
                    animate={{ scale: 1, color: '#2563eb' }}
                    className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400"
                  >
                    ₦{(total / 100).toLocaleString()}
                  </motion.span>
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
              {items.length === 0 
                ? 'Add Items to Continue'
                : paymentMethod === 'prepay' 
                  ? `Pay ₦${(getDiscountedTotal() / 100).toLocaleString()} Now`
                  : getRemainingAmount() > 0
                    ? `Pay ₦${(getPaymentAmount() / 100).toLocaleString()} to Continue`
                    : 'Continue to Payment'
              }
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
