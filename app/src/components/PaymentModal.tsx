import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { initializeMonnifyPayment, generatePaymentReference } from '../lib/monnify'
import Button from './Button'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  orderId: string
  customerName: string
  customerEmail: string
  onSuccess: (reference: string) => void
  paymentType?: 'full' | 'pickup' | 'final'
  originalTotal?: number
}

export default function PaymentModal({
  isOpen,
  onClose,
  amount,
  orderId,
  customerName,
  customerEmail,
  onSuccess,
  paymentType = 'full',
  originalTotal,
}: PaymentModalProps) {
  const [loading, setLoading] = useState(false)

  const handlePayment = () => {
    setLoading(true)
    const reference = generatePaymentReference()

    initializeMonnifyPayment({
      apiKey: import.meta.env.VITE_MONNIFY_API_KEY,
      contractCode: import.meta.env.VITE_MONNIFY_CONTRACT_CODE,
      amount: amount / 100, // Convert from cents to naira
      customerName,
      customerEmail,
      paymentReference: reference,
      paymentDescription: `Payment for Order #${orderId.slice(0, 8).toUpperCase()}`,
      onComplete: (response) => {
        setLoading(false)
        if (response.status === 'SUCCESS') {
          onSuccess(reference)
        }
      },
      onClose: () => {
        setLoading(false)
      },
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            >
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-full mb-6 shadow-xl"
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="8" y="12" width="24" height="18" rx="2" stroke="white" strokeWidth="2.5"/>
                    <path d="M8 18h24M14 24h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </motion.div>
                <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
                  {paymentType === 'pickup' ? 'Pay Pickup Fee' : paymentType === 'final' ? 'Complete Final Payment' : 'Complete Payment'}
                </h2>
                <p className="text-gray-600">
                  {paymentType === 'pickup' 
                    ? 'Pay the pickup fee now, rest when ready' 
                    : paymentType === 'final'
                    ? 'Your clothes are ready! Complete payment to collect'
                    : 'Secure payment powered by Monnify'}
                </p>
              </div>

              {/* Amount */}
              <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl p-6 mb-8">
                {paymentType === 'pickup' && originalTotal ? (
                  <>
                    <p className="text-sm text-gray-600 font-medium mb-2 text-center">
                      Pickup Fee (Pay Now)
                    </p>
                    <p className="text-5xl font-display font-bold text-gray-900 text-center mb-3">
                      ₦{(amount / 100).toLocaleString()}
                    </p>
                    <div className="border-t-2 border-primary-200 pt-3">
                      <p className="text-xs text-gray-600 text-center mb-1">
                        Remaining Balance (Pay Later)
                      </p>
                      <p className="text-2xl font-display font-bold text-gray-700 text-center">
                        ₦{((originalTotal - amount) / 100).toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : paymentType === 'final' && originalTotal ? (
                  <>
                    <p className="text-sm text-gray-600 font-medium mb-2 text-center">
                      Final Payment
                    </p>
                    <p className="text-5xl font-display font-bold text-gray-900 text-center mb-3">
                      ₦{(amount / 100).toLocaleString()}
                    </p>
                    <div className="border-t-2 border-primary-200 pt-3">
                      <p className="text-xs text-gray-600 text-center mb-1">
                        Total Order Value
                      </p>
                      <p className="text-2xl font-display font-bold text-gray-700 text-center">
                        ₦{(originalTotal / 100).toLocaleString()}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 font-medium mb-2 text-center">
                      Amount to Pay
                    </p>
                    <p className="text-5xl font-display font-bold text-gray-900 text-center">
                      ₦{(amount / 100).toLocaleString()}
                    </p>
                  </>
                )}
              </div>

              {/* Payment Details */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-accent-600">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-gray-700">Secure payment gateway</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-accent-600">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-gray-700">Multiple payment methods</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-accent-600">
                    <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 10l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-gray-700">Instant confirmation</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button
                  onClick={handlePayment}
                  loading={loading}
                  fullWidth
                  size="lg"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Proceed to Payment
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  fullWidth
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>

              {/* Security Badge */}
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 2L3 4v4c0 3.5 2 6 5 8 3-2 5-4.5 5-8V4l-5-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M6 8l1.5 1.5L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Secured by 256-bit SSL encryption</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
