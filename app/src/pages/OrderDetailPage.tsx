import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Order, OrderEvent, GarmentTag } from '../types'
import Button from '../components/Button'
import OrderTimeline from '../components/OrderTimeline'
import PaymentModal from '../components/PaymentModal'
import GenerateTagsModal from '../components/GenerateTagsModal'
import GarmentTagsPanel from '../components/GarmentTagsPanel'

export default function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAdmin } = useAuthStore()
  const [order, setOrder] = useState<Order | null>(null)
  const [events, setEvents] = useState<OrderEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showGenerateTagsModal, setShowGenerateTagsModal] = useState(false)
  const [showGarmentTags, setShowGarmentTags] = useState(false)

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
      const isPickupFeePayment = order!.payment_method === 'postpay' && !order!.pickup_fee_paid && (order!.logistics_option === 'pickup' || order!.logistics_option === 'pickup_delivery')
      const isPostpayFullPayment = order!.payment_method === 'postpay' && !order!.pickup_fee_paid && order!.logistics_option === 'none'
      const isFinalPayment = order!.payment_method === 'postpay' && order!.pickup_fee_paid && order!.final_payment_pending
      const isPrepayPayment = order!.payment_method === 'prepay' && !order!.pickup_fee_paid
      
      if (isPickupFeePayment) {
        // Pickup fee payment for postpay
        await supabase
          .from('orders')
          .update({ 
            pickup_fee_paid: true,
            payment_status: 'confirmed' // Initial payment confirmed
          })
          .eq('id', id)

        await supabase.from('payments').insert({
          order_id: id,
          provider: 'monnify',
          provider_payload: { reference, type: 'pickup_fee' },
          amount_cents: 200000, // ₦2,000 pickup fee
          status: 'confirmed',
        })

        await supabase.from('order_events').insert({
          order_id: id,
          event_type: 'payment_received',
          note: 'Pickup fee payment confirmed (₦2,000)',
        })
      } else if (isPostpayFullPayment) {
        // Full payment for postpay with no logistics (self drop-off)
        await supabase
          .from('orders')
          .update({ 
            pickup_fee_paid: true,
            final_payment_pending: false,
            payment_status: 'confirmed'
          })
          .eq('id', id)

        await supabase.from('payments').insert({
          order_id: id,
          provider: 'monnify',
          provider_payload: { reference, type: 'full_payment' },
          amount_cents: order!.total_cents,
          status: 'confirmed',
        })

        await supabase.from('order_events').insert({
          order_id: id,
          event_type: 'payment_received',
          note: 'Full payment confirmed',
        })
      } else if (isFinalPayment) {
        // Final payment for postpay
        const remainingAmount = order!.total_cents - 200000
        
        await supabase
          .from('orders')
          .update({ 
            final_payment_pending: false,
            payment_status: 'confirmed'
          })
          .eq('id', id)

        await supabase.from('payments').insert({
          order_id: id,
          provider: 'monnify',
          provider_payload: { reference, type: 'final_payment' },
          amount_cents: remainingAmount,
          status: 'confirmed',
        })

        await supabase.from('order_events').insert({
          order_id: id,
          event_type: 'payment_received',
          note: `Final payment confirmed (₦${(remainingAmount / 100).toLocaleString()})`,
        })
      } else if (isPrepayPayment) {
        // Full prepay payment with 2% discount on items only (not logistics)
        // The order.total_cents already has the discount applied from NewOrderPage
        const discountedAmount = order!.total_cents
        
        await supabase
          .from('orders')
          .update({ 
            pickup_fee_paid: true,
            final_payment_pending: false,
            payment_status: 'confirmed'
          })
          .eq('id', id)

        await supabase.from('payments').insert({
          order_id: id,
          provider: 'monnify',
          provider_payload: { reference, type: 'prepay_full', discount: '2%' },
          amount_cents: discountedAmount,
          status: 'confirmed',
        })

        await supabase.from('order_events').insert({
          order_id: id,
          event_type: 'payment_received',
          note: `Prepay payment confirmed with 2% discount on items (₦${(discountedAmount / 100).toLocaleString()})`,
        })
      } else {
        // Fallback - shouldn't reach here
        await supabase
          .from('orders')
          .update({ payment_status: 'confirmed' })
          .eq('id', id)

        await supabase.from('payments').insert({
          order_id: id,
          provider: 'monnify',
          provider_payload: { reference },
          amount_cents: order!.total_cents,
          status: 'confirmed',
        })

        await supabase.from('order_events').insert({
          order_id: id,
          event_type: 'payment_received',
          note: 'Payment confirmed',
        })
      }

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

          {/* Initial Payment - Prepay or Postpay Pickup Fee */}
          {order.payment_status === 'pending' && !order.pickup_fee_paid && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-3xl border-2 border-primary-300 p-8 shadow-lg"
            >
              {order.payment_method === 'postpay' ? (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect x="6" y="10" width="20" height="14" rx="2" stroke="white" strokeWidth="2.5"/>
                        <path d="M6 15h20M10 20h6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">
                        Pay Pickup Fee
                      </h3>
                      <p className="text-gray-700 font-medium">
                        {order.logistics_option === 'pickup' || order.logistics_option === 'pickup_delivery'
                          ? 'Secure your pickup slot with ₦2,000'
                          : 'Complete payment to confirm your order'}
                      </p>
                    </div>
                  </div>
                  
                  {(order.logistics_option === 'pickup' || order.logistics_option === 'pickup_delivery') && (
                    <div className="bg-white rounded-2xl p-6 mb-6">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 font-medium">Pickup Fee (Pay Now)</span>
                        <span className="text-2xl font-display font-bold text-primary-600">
                          ₦2,000
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-gray-600 font-medium">Remaining Balance (Pay Later)</span>
                        <span className="text-lg font-bold text-gray-900">
                          ₦{((order.total_cents - 200000) / 100).toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                        <span className="text-gray-900 font-bold">Total Order Value</span>
                        <span className="text-xl font-display font-bold text-gray-900">
                          ₦{(order.total_cents / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}

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
                    {order.logistics_option === 'pickup' || order.logistics_option === 'pickup_delivery'
                      ? 'Pay Pickup Fee (₦2,000)'
                      : `Pay Full Amount (₦${(order.total_cents / 100).toLocaleString()})`}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        <rect x="6" y="10" width="20" height="14" rx="2" stroke="white" strokeWidth="2.5"/>
                        <path d="M6 15h20M10 20h6" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">
                        Complete Payment
                      </h3>
                      <p className="text-gray-700 font-medium">
                        Pay full amount now and get 2% discount + priority processing
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-6 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total Amount (2% Off Items)</span>
                      <div className="text-right">
                        <span className="text-3xl font-display font-bold text-primary-600">
                          ₦{(order.total_cents / 100).toLocaleString()}
                        </span>
                        <span className="block text-sm text-gray-500 line-through">
                          ₦{(order.total_cents / 100).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

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
                    Pay ₦{(order.total_cents / 100).toLocaleString()} Now
                  </Button>
                </>
              )}
            </motion.div>
          )}

          {/* Final Payment for Postpay Orders */}
          {order.payment_method === 'postpay' && order.pickup_fee_paid && order.final_payment_pending && order.status === 'ready' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-accent-50 to-accent-100 rounded-3xl border-2 border-accent-300 p-8 shadow-lg"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-accent-600 rounded-full flex items-center justify-center animate-pulse">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 8v16M8 16h16" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-gray-900 mb-1">
                    Your Clothes Are Ready! 🎉
                  </h3>
                  <p className="text-gray-700 font-medium">
                    Complete payment to collect your fresh laundry
                  </p>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600 font-medium">Pickup Fee (Paid)</span>
                  <span className="text-gray-900 font-bold line-through">₦2,000</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600 font-medium">Remaining Balance</span>
                  <span className="text-2xl font-display font-bold text-accent-600">
                    ₦{((order.total_cents - 200000) / 100).toLocaleString()}
                  </span>
                </div>
                <div className="border-t-2 border-gray-200 pt-3 flex justify-between items-center">
                  <span className="text-gray-900 font-bold">Total Order Value</span>
                  <span className="text-xl font-display font-bold text-gray-900">
                    ₦{(order.total_cents / 100).toLocaleString()}
                  </span>
                </div>
              </div>

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
                Pay Remaining ₦{((order.total_cents - 200000) / 100).toLocaleString()}
              </Button>
            </motion.div>
          )}

          {/* Payment Completed Message */}
          {order.payment_method === 'postpay' && order.pickup_fee_paid && !order.final_payment_pending && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl border-2 border-green-300 p-8 text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M8 16l6 6 10-10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">
                Payment Complete!
              </h3>
              <p className="text-gray-700 font-medium">
                Thank you for your payment. Your order is fully paid.
              </p>
            </motion.div>
          )}

          {/* Garment Tags Section (Admin Only) */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-lg"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-accent-100 rounded-2xl flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="6" y="6" width="12" height="12" rx="2" stroke="#10b981" strokeWidth="2"/>
                      <path d="M9 9h6M9 12h6M9 15h3" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <h2 className="text-xl font-display font-bold text-gray-900">Garment Tags</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowGarmentTags(!showGarmentTags)}
                  >
                    {showGarmentTags ? 'Hide Tags' : 'View Tags'}
                  </Button>
                  <Button onClick={() => setShowGenerateTagsModal(true)}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Generate Tags
                  </Button>
                </div>
              </div>
              
              {showGarmentTags && (
                <div className="mt-6">
                  <GarmentTagsPanel orderId={order.id} />
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>

      {/* Generate Tags Modal */}
      {order && (
        <GenerateTagsModal
          isOpen={showGenerateTagsModal}
          onClose={() => setShowGenerateTagsModal(false)}
          order={order}
          onSuccess={() => {
            setShowGenerateTagsModal(false)
            setShowGarmentTags(true)
          }}
        />
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={
          order.payment_method === 'prepay' && !order.pickup_fee_paid
            ? order.total_cents // Already has 2% discount on items (not logistics)
            : order.payment_method === 'postpay' && !order.pickup_fee_paid && (order.logistics_option === 'pickup' || order.logistics_option === 'pickup_delivery')
            ? 200000 // Pickup fee
            : order.payment_method === 'postpay' && !order.pickup_fee_paid
            ? order.total_cents // Full amount if no logistics
            : order.payment_method === 'postpay' && order.pickup_fee_paid && order.final_payment_pending
            ? order.total_cents - 200000 // Remaining balance
            : order.total_cents // Fallback
        }
        orderId={order.id}
        customerName={user?.display_name || user?.email || 'Customer'}
        customerEmail={user?.email || ''}
        onSuccess={handlePaymentSuccess}
        paymentType={
          order.payment_method === 'postpay' && !order.pickup_fee_paid && (order.logistics_option === 'pickup' || order.logistics_option === 'pickup_delivery')
            ? 'pickup'
            : order.payment_method === 'postpay' && order.pickup_fee_paid && order.final_payment_pending
            ? 'final'
            : 'full'
        }
        originalTotal={order.total_cents}
      />
    </div>
  )
}
