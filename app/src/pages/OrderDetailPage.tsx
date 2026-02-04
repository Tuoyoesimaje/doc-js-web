import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Order, OrderEvent } from '../types'
import Button from '../components/Button'
import OrderTimeline from '../components/OrderTimeline'
import PaymentModal from '../components/PaymentModal'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)

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

  const handlePaymentSuccess = async (reference: string) => {
    try {
      // Update order payment status
      await supabase
        .from('orders')
        .update({ payment_status: 'confirmed' })
        .eq('id', id)

      // Create payment record
      await supabase.from('payments').insert({
        order_id: id,
        provider: 'monnify',
        provider_payload: { reference },
        amount_cents: order!.total_cents,
        status: 'confirmed',
      })

      // Create payment event
      await supabase.from('order_events').insert({
        order_id: id,
        event_type: 'payment_received',
        note: 'Payment confirmed',
      })

      setShowPaymentModal(false)
      loadOrder()
      loadEvents()
    } catch (error) {
      console.error('Failed to update payment:', error)
    }
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
            
            {/* Logistics Fee */}
            {order.logistics_option !== 'none' && (
              <div className="mt-4 p-4 bg-blue-50 rounded-2xl border-2 border-blue-200">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-blue-600">
                      <path d="M13 16V6C13 4.89543 13.8954 4 15 4H19C20.1046 4 21 4.89543 21 6V16M13 16H3L5 8H11L13 16ZM13 16H21M21 16H23V18C23 19.1046 22.1046 20 21 20H19.5M13 16V18C13 19.1046 12.1046 20 11 20H9.5M9.5 20C9.5 21.3807 8.38071 22.5 7 22.5C5.61929 22.5 4.5 21.3807 4.5 20C4.5 18.6193 5.61929 17.5 7 17.5C8.38071 17.5 9.5 18.6193 9.5 20ZM19.5 20C19.5 21.3807 18.3807 22.5 17 22.5C15.6193 22.5 14.5 21.3807 14.5 20C14.5 18.6193 15.6193 17.5 17 17.5C18.3807 17.5 19.5 18.6193 19.5 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <div>
                      <p className="font-bold text-blue-900">
                        {order.logistics_option === 'pickup' ? 'Pickup Only' : 'Pickup & Delivery'}
                      </p>
                      <p className="text-sm text-blue-700">
                        {order.logistics_option === 'pickup' 
                          ? 'We\'ll pick up your laundry' 
                          : 'Full door-to-door service'}
                      </p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-blue-600">
                    ₦{(order.logistics_fee_cents / 100).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
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
              <Button 
                fullWidth 
                size="lg" 
                className="shadow-2xl"
                onClick={() => setShowPaymentModal(true)}
              >
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

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={order.total_cents}
        orderId={order.id}
        customerName={user?.display_name || user?.email || 'Customer'}
        customerEmail={user?.email || ''}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}
