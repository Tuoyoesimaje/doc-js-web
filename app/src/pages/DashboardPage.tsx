import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import type { Order } from '../types'
import Button from '../components/Button'
import OrderCard from '../components/OrderCard'
import ProfileModal from '../components/ProfileModal'

export default function DashboardPage() {
  const { user, signOut } = useAuthStore()
  const location = useLocation()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)

  useEffect(() => {
    loadOrders()
    
    // Show profile modal if user hasn't set their name
    if (user && !user.display_name) {
      setTimeout(() => setShowProfileModal(true), 1000)
    }
  }, [location.pathname, user])

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          address:addresses(*),
          items:order_items(*, service:services(*))
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b-2 border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="8" width="12" height="11" rx="1" stroke="white" strokeWidth="2"/>
                  <path d="M8 6v4M16 6v4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="10" cy="14" r="1" fill="white"/>
                  <circle cx="14" cy="14" r="1" fill="white"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">{getGreeting()},</p>
                <h1 className="text-2xl font-display font-bold text-gray-900">
                  {user?.display_name || user?.email?.split('@')[0] || 'Welcome'}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Profile
              </button>
              <button
                onClick={signOut}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M13 3h3a2 2 0 012 2v10a2 2 0 01-2 2h-3M7 14l-4-4m0 0l4-4m-4 4h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Banner for New Users */}
        {user && !user.display_name && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-3xl p-6 shadow-xl text-white"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="9" r="4" stroke="white" strokeWidth="2"/>
                    <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg mb-1">Welcome to Doc JS Laundry!</h3>
                  <p className="text-primary-100 text-sm">Complete your profile to personalize your experience</p>
                </div>
              </div>
              <Button
                onClick={() => setShowProfileModal(true)}
                variant="secondary"
                className="!bg-white !text-primary-600 !border-0 shadow-lg hover:shadow-xl"
              >
                Add Your Name
              </Button>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-white">
                <h2 className="text-3xl font-display font-bold mb-2">Ready for fresh clothes?</h2>
                <p className="text-primary-100 text-lg">Create a new order in under 2 minutes</p>
              </div>
              <Link to="/new-order">
                <Button
                  size="lg"
                  variant="secondary"
                  className="!bg-white !text-primary-600 !border-0 shadow-xl hover:shadow-2xl hover:!bg-gray-50"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  New Order
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent-100 rounded-2xl flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <path d="M14 4v20M4 14h20" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                <p className="text-3xl font-display font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-warning-100 rounded-2xl flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="10" stroke="#f59e0b" strokeWidth="2.5"/>
                  <path d="M14 8v6l4 2" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">In Progress</p>
                <p className="text-3xl font-display font-bold text-gray-900">
                  {orders.filter(o => o.status !== 'delivered').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-100 rounded-2xl flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="10" stroke="#2563eb" strokeWidth="2.5"/>
                  <path d="M9 14l3 3 7-7" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Completed</p>
                <p className="text-3xl font-display font-bold text-gray-900">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-900">Recent Orders</h2>
            {orders.length > 0 && (
              <button className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                View All →
              </button>
            )}
          </div>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-300 p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <rect x="10" y="14" width="20" height="18" rx="2" stroke="#9ca3af" strokeWidth="2.5"/>
                  <path d="M14 10v8M26 10v8" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="18" cy="24" r="2" fill="#9ca3af"/>
                  <circle cx="22" cy="24" r="2" fill="#9ca3af"/>
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-3">No orders yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Start your first order and experience our premium laundry service
              </p>
              <Link to="/new-order">
                <Button size="lg">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Create Your First Order
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <OrderCard order={order} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  )
}
