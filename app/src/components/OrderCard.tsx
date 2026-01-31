import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Order } from '../types'

interface OrderCardProps {
  order: Order
}

export default function OrderCard({ order }: OrderCardProps) {
  const statusConfig = {
    received: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 5v3M8 11h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    processing: {
      color: 'bg-warning-100 text-warning-800 border-warning-200',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 4v4l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    ready: {
      color: 'bg-primary-100 text-primary-800 border-primary-200',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    delivered: {
      color: 'bg-accent-100 text-accent-800 border-accent-200',
      icon: (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M3 8l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  }

  const config = statusConfig[order.status]

  return (
    <Link to={`/orders/${order.id}`}>
      <motion.div
        whileHover={{ scale: 1.01, y: -2 }}
        className="bg-white rounded-2xl border-2 border-gray-100 p-6 hover:border-primary-600 hover:shadow-xl transition-all duration-300 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-4">
          {/* Left Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${config.color}`}>
                {config.icon}
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
              <span className="text-sm text-gray-500 font-medium">
                {new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gray-400">
                <rect x="4" y="6" width="10" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M6 4v4M12 4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
                <circle cx="10" cy="11" r="0.75" fill="currentColor"/>
              </svg>
              <span className="text-sm text-gray-700 font-semibold">
                {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
              </span>
            </div>

            {order.address && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-gray-400 mt-0.5 flex-shrink-0">
                  <path d="M9 2C6.79 2 5 3.79 5 6c0 3.75 4 8 4 8s4-4.25 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="9" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span className="truncate">{order.address.label} • {order.address.city}</span>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="text-right flex-shrink-0">
            <div className="text-2xl font-display font-bold text-gray-900 mb-1">
              ₦{(order.total_cents / 100).toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              {order.payment_status === 'confirmed' ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-accent-600">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 7l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-xs font-bold text-accent-600">Paid</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-warning-600">
                    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M7 4v3M7 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <span className="text-xs font-bold text-warning-600">Pending</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* View Details Arrow */}
        <div className="mt-4 pt-4 border-t-2 border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </span>
          <span className="text-sm font-semibold text-primary-600 flex items-center gap-1">
            View Details
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </motion.div>
    </Link>
  )
}
