import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { parseBulkOrder, calculateTotal } from '../utils/orderParser'
import { createGarmentTagsForOrder } from '../utils/garmentTags'
import type { Service, ParsedOrderItem, Employee } from '../types'
import Button from '../components/Button'
import Input from '../components/Input'
import QuickOrderInput from '../components/QuickOrderInput'
import VisualOrderSelect from '../components/VisualOrderSelect'

type OrderMode = 'quick' | 'visual'

export default function WalkInOrderPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<OrderMode>('quick')
  const [services, setServices] = useState<Service[]>([])
  const [items, setItems] = useState<ParsedOrderItem[]>([])
  const [employee, setEmployee] = useState<Employee | null>(null)
  
  // Customer details
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [street, setStreet] = useState('')
  
  // Debug logging
  useEffect(() => {
    console.log('Customer state updated:', { customerName, customerPhone, customerEmail, street })
  }, [customerName, customerPhone, customerEmail, street])
  
  const [expressService, setExpressService] = useState(false)
  const [loading, setLoading] = useState(false)
  const [autoGenerateTags, setAutoGenerateTags] = useState(true)

  useEffect(() => {
    loadServices()
    loadEmployeeData()
  }, [])

  const loadServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name')
    
    if (data) setServices(data)
  }

  const loadEmployeeData = () => {
    const employeeDataStr = sessionStorage.getItem('employee_data')
    if (employeeDataStr) {
      setEmployee(JSON.parse(employeeDataStr))
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
    console.log('Submit clicked:', { customerName, customerPhone, itemsLength: items.length, employee: !!employee })
    
    if (!customerName || !customerPhone || items.length === 0 || !employee) {
      console.log('Validation failed:', {
        hasName: !!customerName,
        hasPhone: !!customerPhone,
        hasItems: items.length > 0,
        hasEmployee: !!employee
      })
      
      // More specific error message
      if (!employee) {
        alert('Employee session not found. Please log in again.')
        navigate('/employee/login')
        return
      }
      
      if (!customerName) {
        alert('Please enter customer name')
        return
      }
      
      if (!customerPhone) {
        alert('Please enter customer phone number')
        return
      }
      
      if (items.length === 0) {
        alert('Please add items to the order')
        return
      }
      
      alert('Please fill in customer name, phone, and add items')
      return
    }

    setLoading(true)
    try {
      const total = calculateOrderTotal()

      // Create or get customer user account
      let userId: string
      const normalizedPhone = customerPhone.startsWith('+') 
        ? customerPhone 
        : `+234${customerPhone.replace(/^0/, '')}`

      // Check if customer exists by phone
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', normalizedPhone)
        .maybeSingle()

      if (existingUser) {
        userId = existingUser.id
      } else {
        // Create auth user for walk-in customer with a temporary password
        // They can reset it later if they want to use the app
        const tempPassword = `WalkIn${Math.random().toString(36).slice(2, 10)}!`
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: customerEmail || `${normalizedPhone.replace(/\+/g, '')}@walkin.docjslaundry.com`,
          password: tempPassword,
          phone: normalizedPhone,
          options: {
            data: {
              display_name: customerName,
              is_walkin: true,
            }
          }
        })

        if (authError) {
          console.error('Auth user creation error:', authError)
          throw new Error(`Failed to create customer account: ${authError.message}`)
        }

        if (!authData.user) {
          throw new Error('Failed to create customer account: No user returned')
        }

        userId = authData.user.id

        // The users table record should be created automatically by a trigger
        // Wait a moment for it to be created
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Verify the user record was created
        const { data: verifyUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (!verifyUser) {
          // If trigger didn't create it, create it manually
          const { error: userError } = await supabase
            .from('users')
            .insert({
              id: userId,
              phone: normalizedPhone,
              email: customerEmail || null,
              display_name: customerName,
              password_set: true,
            })
          
          if (userError) {
            console.error('User record creation error:', userError)
            throw new Error(`Failed to create customer record: ${userError.message}`)
          }
        }
      }

      // Create address for customer
      const { data: address, error: addressError } = await supabase
        .from('addresses')
        .insert({
          user_id: userId,
          label: 'Walk-in Address',
          line1: street || 'Walk-in customer',
          city: employee.pickup_location?.city || 'Warri',
          state: employee.pickup_location?.state || 'Delta',
          phone: customerPhone,
          is_default: true,
        })
        .select()
        .single()

      if (addressError) {
        console.error('Address creation error:', addressError)
        throw addressError
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          address_id: address.id,
          total_cents: total,
          status: 'received',
          payment_status: 'pending',
          payment_method: 'postpay',
          pickup_fee_paid: false,
          final_payment_pending: true,
          logistics_option: 'none',
          logistics_fee_cents: 0,
          created_by_employee_id: employee.id,
          pickup_location_id: employee.pickup_location_id,
        })
        .select()
        .single()

      if (orderError) {
        console.error('Order creation error:', orderError)
        throw orderError
      }

      // Create order items
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

      const { data: createdItems, error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
        .select()

      if (itemsError) throw itemsError

      // Create order event
      await supabase.from('order_events').insert({
        order_id: order.id,
        event_type: 'created',
        note: `Walk-in order created by ${employee.employee_name} at ${employee.pickup_location?.name}`,
      })

      // Auto-generate garment tags if enabled
      if (autoGenerateTags) {
        const tagItems = createdItems.map(item => ({
          orderItemId: item.id,
          serviceName: services.find(s => s.id === item.service_id)?.name || item.description,
          quantity: item.quantity,
        }))

        await createGarmentTagsForOrder(
          order.id,
          tagItems,
          customerName,
          customerPhone
        )
      }

      alert(`Order created successfully! Order ID: ${order.id.slice(0, 8).toUpperCase()}`)
      navigate('/employee')
    } catch (error) {
      console.error('Failed to create order:', error)
      alert(`Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const total = calculateOrderTotal()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b-2 border-gray-100 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/employee')}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Walk-In Order</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">{employee?.pickup_location?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total</p>
              <p className="text-2xl font-display font-bold text-primary-600 dark:text-primary-400">
                ₦{items.length === 0 ? '0' : (total / 100).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Customer Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0" stroke="#2563eb" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Customer Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Customer Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="John Doe"
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08012345678"
                required
              />
              <Input
                label="Email (Optional)"
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
              />
              <Input
                label="Address (Optional)"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                placeholder="Street address"
              />
            </div>
          </motion.div>

          {/* Order Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900/50 rounded-xl flex items-center justify-center">
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

          {/* Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-100 dark:border-gray-700 p-5 shadow-lg space-y-4"
          >
            <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <input
                type="checkbox"
                checked={expressService}
                onChange={(e) => setExpressService(e.target.checked)}
                className="w-5 h-5 text-primary-600 dark:text-primary-500 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">Express Service</span>
                  <span className="text-xs font-bold text-warning-600 dark:text-warning-400">+50%</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Same day delivery</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <input
                type="checkbox"
                checked={autoGenerateTags}
                onChange={(e) => setAutoGenerateTags(e.target.checked)}
                className="w-5 h-5 text-accent-600 dark:text-accent-500 rounded-lg focus:ring-2 focus:ring-accent-500 dark:focus:ring-accent-400 cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 dark:text-white">Auto-Generate Tags</span>
                  <span className="text-xs font-bold text-accent-600 dark:text-accent-400">RECOMMENDED</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Automatically create garment tags for tracking</p>
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
                  {items.map((item, idx) => {
                    const service = services.find(s => s.key === item.service_key)
                    const itemTotal = (service?.base_price_cents || 0) * item.quantity
                    return (
                      <div
                        key={`${item.service_key}-${idx}`}
                        className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl"
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
                        <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                          ₦{(itemTotal / 100).toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t-2 border-gray-200 dark:border-gray-700 pt-4 flex justify-between items-center">
                  <span className="text-xl font-display font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-3xl font-display font-bold text-primary-600 dark:text-primary-400">
                    ₦{(total / 100).toLocaleString()}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleSubmitOrder}
              loading={loading}
              disabled={!customerName || !customerPhone || items.length === 0}
              fullWidth
              size="lg"
              className="shadow-2xl"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {items.length === 0 
                ? 'Add Items to Continue'
                : `Create Order (₦${(total / 100).toLocaleString()})`
              }
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
