import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import type { Order, OrderEvent } from '../types'
import Button from '../components/Button'
import OrderTimeline from '../components/OrderTimeline'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
    loadEvents()
  }, [id])

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          address:addresses(*),
          items:order_items(*, service:services(*))
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error('Failed to load order:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadEvents = async () => {
    const { data } = await supabase
      .from('order_events')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true })

    if (data) setEvents(data)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="16" stroke="#ef4444" strokeWidth="2.5"/>
              <path d="M20 12v8M20 28h.01" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-3">Order Not Found</h2>
          <p className="text-gray-600 mb-8">We couldn't find the order you're looking for.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const statusConfig = {
    received: { color: 'bg-gray-100 text-gray-800 border-gray-200' },
    processing: { color: 'bg-warning-100 text-warning-800 border-warning-200' },
    ready: { color: 'bg-primary-100 text-primary-800 border-primary-200' },
    delivered: { color: 'bg-accent-100 text-accent-800 border-accent-200' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b-2 border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-4 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Dashboard
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-900 mb-1">Order Details</h1>
              <p className="text-sm text-gray-600">Order #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 ${statusConfig[order.status].color}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Order Status Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg"
          >
            <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Order Status</h2>
            <OrderTimeline status={order.status} events={events} />
          </motion.div>

          {/* Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg"
          >
            <h2 className="text-xl font-display font-bold text-gray-900 mb-6">Items</h2>
            <div className="space-y-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{item.description}</h4>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity} × ₦{(item.unit_price_cents / 100).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ₦{((item.quantity * item.unit_price_cents) / 100).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-gray-200 mt-6 pt-6 flex justify-between items-center">
              <span className="text-2xl font-display font-bold text-gray-900">Total</span>
              <span className="text-3xl font-display font-bold text-primary-600">
                ₦{(order.total_cents / 100).toLocaleString()}
              </span>
            </div>
          </motion.div>

          {/* Delivery Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round"/>
                  <circle cx="12" cy="9" r="2.5" stroke="#2563eb" strokeWidth="2"/>
                </svg>
              </div>
              <h2 className="text-xl font-display font-bold text-gray-900">Delivery Address</h2>
            </div>
            <div className="text-gray-700 leading-relaxed">
              <p className="font-semibold text-gray-900 mb-1">{order.address?.label}</p>
              <p>{order.address?.line1}</p>
              {order.address?.line2 && <p>{order.address.line2}</p>}
              <p>{order.address?.city}, {order.address?.state}</p>
            </div>
          </motion.div>

          {/* Payment Status */}
          {order.payment_status === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button fullWidth size="lg" className="shadow-2xl">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 10h18M7 14h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Complete Payment
              </Button>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}
