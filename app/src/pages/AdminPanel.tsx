import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import Button from '../components/Button'

export default function AdminPanel() {
  const location = useLocation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'ready'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadOrders()
  }, [location.pathname])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          address:addresses(*),
          items:order_items(*),
          user:users(display_name, email, phone)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error

      await supabase.from('order_events').insert({
        order_id: orderId,
        event_type: newStatus,
        note: `Status updated to ${newStatus} by admin`,
      })

      loadOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesFilter = filter === 'all' || 
      (filter === 'pending' && order.status === 'received') ||
      order.status === filter
    
    const matchesSearch = !searchQuery || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'received').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.reduce((sum, o) => sum + o.total_cents, 0),
    pendingPayments: orders.filter(o => 
      (o.payment_method === 'postpay' && !o.pickup_fee_paid) || 
      (o.payment_method === 'postpay' && o.final_payment_pending) ||
      (!o.payment_method && o.payment_status === 'pending')
    ).length,
  }

  const statusConfig = {
    received: { 
      label: 'Pending', 
      color: 'bg-gray-100 text-gray-800 border-gray-300',
    },
    processing: { 
      label: 'Processing', 
      color: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    ready: { 
      label: 'Ready', 
      color: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    delivered: { 
      label: 'Delivered', 
      color: 'bg-green-100 text-green-800 border-green-300',
    },
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b-2 border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-14 h-14 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-xl"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600 font-medium">Manage orders and track performance</p>
              </div>
            </div>
            <Link to="/dashboard">
              <Button variant="secondary">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 10h14M10 3l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Customer View
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Enhanced Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 shadow-xl text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="2" stroke="white" strokeWidth="2"/>
                  <path d="M3 9h18M9 3v18" stroke="white" strokeWidth="2"/>
                </svg>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Total Orders</p>
            <p className="text-4xl font-display font-bold">{stats.total}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 shadow-xl text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2"/>
                  <path d="M12 6v6l4 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <p className="text-orange-100 text-sm font-medium mb-1">Pending</p>
            <p className="text-4xl font-display font-bold">{stats.pending}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 shadow-xl text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="animate-spin">
                  <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <p className="text-purple-100 text-sm font-medium mb-1">Processing</p>
            <p className="text-4xl font-display font-bold">{stats.processing}</p>
          </motion.div>

          <motion.div 
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-xl text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Ready</p>
            <p className="text-4xl font-display font-bold">{stats.ready}</p>
          </motion.div>
        </motion.div>

        {/* Revenue & Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-3xl font-display font-bold text-gray-900">
                  ₦{(stats.revenue / 100).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 font-bold">↑ 12%</span>
              <span className="text-gray-600">vs last month</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-warning-100 rounded-2xl flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="12" rx="2" stroke="#f59e0b" strokeWidth="2"/>
                  <path d="M3 10h18M7 14h4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending Payments</p>
                <p className="text-3xl font-display font-bold text-gray-900">
                  {stats.pendingPayments}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-warning-600 font-bold">⚠️</span>
              <span className="text-gray-600">Requires attention</span>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-lg mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
                <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search by order ID, customer name, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-primary-600 focus:ring-4 focus:ring-primary-100 transition-all duration-200 outline-none font-medium"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2">
              {(['all', 'pending', 'processing', 'ready'] as const).map((f) => (
                <motion.button
                  key={f}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(f)}
                  className={`px-6 py-3 rounded-2xl font-bold transition-all duration-200 ${
                    filter === f
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">
              Orders ({filteredOrders.length})
            </h2>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.03 }}
                  whileHover={{ scale: 1.01, y: -2 }}
                  className="bg-white rounded-3xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="font-mono text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-lg">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold border-2 ${statusConfig[order.status].color}`}>
                          {statusConfig[order.status].label}
                        </span>
                        
                        {/* Payment Method Badge */}
                        {order.payment_method === 'prepay' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-800 border-2 border-green-300">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M7 2v10M11 6H9a2 2 0 000 4h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            Prepay (5% Off)
                          </span>
                        )}
                        {order.payment_method === 'postpay' && !order.pickup_fee_paid && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800 border-2 border-orange-300">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M7 4v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            Awaiting Pickup Fee
                          </span>
                        )}
                        {order.payment_method === 'postpay' && order.pickup_fee_paid && order.final_payment_pending && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-800 border-2 border-yellow-300 animate-pulse">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M7 3v4M7 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            Final Payment Pending
                          </span>
                        )}
                        {order.payment_method === 'postpay' && order.pickup_fee_paid && !order.final_payment_pending && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-800 border-2 border-green-300">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M3 7l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Postpay (Paid)
                          </span>
                        )}
                        
                        {/* Legacy Payment Status Badge */}
                        {!order.payment_method && order.payment_status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-800 border-2 border-red-300">
                            Payment Pending
                          </span>
                        )}
                        
                        {/* Logistics Badge */}
                        {order.logistics_option !== 'none' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border-2 border-blue-300">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M10 11V5c0-.6.4-1 1-1h1.5c.6 0 1 .4 1 1v6m-3.5 0H2l1-4h3l1 4zm0 0h3.5m0 0h.5v1c0 .5-.4 1-1 1h-.5m-3.5-2v1c0 .5-.4 1-1 1H7m-1.5 0a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0zm5.5 0a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {order.logistics_option === 'pickup' ? 'Pickup' : 'Pickup & Delivery'}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium mb-1">Customer</p>
                          <p className="text-gray-900 font-bold">{order.user?.display_name || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium mb-1">Items</p>
                          <p className="text-gray-900 font-bold">{order.items?.length || 0} items</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium mb-1">Total</p>
                          <p className="text-primary-600 font-bold text-lg">
                            ₦{(order.total_cents / 100).toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium mb-1">Date</p>
                          <p className="text-gray-900 font-bold">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {order.status === 'received' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order.id, 'processing')
                          }}
                        >
                          Start Processing
                        </Button>
                      )}
                      {order.status === 'processing' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order.id, 'ready')
                          }}
                        >
                          Mark Ready
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order.id, 'delivered')
                          }}
                        >
                          Mark Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredOrders.length === 0 && (
              <div className="bg-white rounded-3xl border-2 border-dashed border-gray-300 p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <path d="M20 10v20M10 20h20" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">No orders found</h3>
                <p className="text-gray-600">Try adjusting your filters or search query</p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
