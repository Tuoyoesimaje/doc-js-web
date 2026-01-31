import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import Button from '../components/Button'

export default function AdminPanel() {
  const location = useLocation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'processing' | 'ready'>('all')

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
          items:order_items(*)
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
        note: `Status updated to ${newStatus}`,
      })

      loadOrders()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'pending') return order.status === 'received'
    return order.status === filter
  })

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'received').length,
    processing: orders.filter(o => o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b-2 border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">Manage all orders</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
            <p className="text-sm text-gray-600 font-medium mb-1">Total Orders</p>
            <p className="text-3xl font-display font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
            <p className="text-sm text-gray-600 font-medium mb-1">Pending</p>
            <p className="text-3xl font-display font-bold text-warning-600">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
            <p className="text-sm text-gray-600 font-medium mb-1">Processing</p>
            <p className="text-3xl font-display font-bold text-primary-600">{stats.processing}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm">
            <p className="text-sm text-gray-600 font-medium mb-1">Ready</p>
            <p className="text-3xl font-display font-bold text-accent-600">{stats.ready}</p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-8"
        >
          {(['all', 'pending', 'processing', 'ready'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                filter === f
                  ? 'bg-primary-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-primary-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border-2 border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-sm font-bold text-gray-900">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <span className="font-semibold">
                      {order.items?.length || 0} items
                    </span>
                    <span>•</span>
                    <span className="font-bold text-primary-600">
                      ₦{(order.total_cents / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {order.status !== 'processing' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                    >
                      Processing
                    </Button>
                  )}
                  {order.status !== 'ready' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                    >
                      Ready
                    </Button>
                  )}
                  {order.status !== 'delivered' && (
                    <Button
                      size="sm"
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                    >
                      Delivered
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  )
}
