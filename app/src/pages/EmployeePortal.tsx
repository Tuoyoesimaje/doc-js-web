import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import type { Order, Employee } from '../types'
import Button from '../components/Button'
import OrderCard from '../components/OrderCard'

export default function EmployeePortal() {
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'today' | 'pending'>('today')

  useEffect(() => {
    loadEmployeeData()
    loadOrders()
  }, [])

  const loadEmployeeData = async () => {
    try {
      const employeeDataStr = sessionStorage.getItem('employee_data')
      if (employeeDataStr) {
        setEmployee(JSON.parse(employeeDataStr))
      }
    } catch (error) {
      console.error('Failed to load employee data:', error)
    }
  }

  const loadOrders = async () => {
    try {
      const employeeDataStr = sessionStorage.getItem('employee_data')
      if (!employeeDataStr) return

      const employeeData = JSON.parse(employeeDataStr)

      // Load orders from this location
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          address:addresses(*),
          items:order_items(*, service:services(*)),
          user:users(display_name, email, phone)
        `)
        .eq('pickup_location_id', employeeData.pickup_location_id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    sessionStorage.removeItem('employee_verified')
    sessionStorage.removeItem('employee_data')
    await supabase.auth.signOut()
    window.location.href = '/app/employee/login'
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'today') {
      const today = new Date().toDateString()
      const orderDate = new Date(order.created_at).toDateString()
      return today === orderDate
    }
    if (filter === 'pending') {
      return order.status === 'received' || order.status === 'processing'
    }
    return true
  })

  const stats = {
    today: orders.filter(o => {
      const today = new Date().toDateString()
      const orderDate = new Date(o.created_at).toDateString()
      return today === orderDate
    }).length,
    pending: orders.filter(o => o.status === 'received' || o.status === 'processing').length,
    ready: orders.filter(o => o.status === 'ready').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 dark:border-primary-800 border-t-primary-600 dark:border-t-primary-400 mb-4 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border-b-2 border-gray-100 dark:border-gray-700 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-14 h-14 bg-gradient-to-br from-accent-600 to-accent-700 dark:from-accent-500 dark:to-accent-600 rounded-2xl flex items-center justify-center shadow-xl"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 5h4v2h-4V5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                </svg>
              </motion.div>
              <div>
                <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white">Employee Portal</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {employee?.employee_name} • {employee?.pickup_location?.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => navigate('/employee/walk-in')}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                New Walk-In Order
              </Button>
              <Button
                variant="secondary"
                onClick={handleLogout}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M13 16l4-4-4-4M17 12H7M7 2H5a2 2 0 00-2 2v12a2 2 0 002 2h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          <motion.div
            whileHover={{ scale: 1.02, y: -4 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 shadow-xl text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium mb-1">Today's Orders</p>
            <p className="text-4xl font-display font-bold">{stats.today}</p>
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
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-6 shadow-xl text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-green-100 text-sm font-medium mb-1">Ready for Pickup</p>
            <p className="text-4xl font-display font-bold">{stats.ready}</p>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-3 mb-8"
        >
          {(['all', 'today', 'pending'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all duration-200 ${
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
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
              Orders ({filteredOrders.length})
            </h2>
            <button
              onClick={loadOrders}
              className="text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Refresh
            </button>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border-2 border-gray-100 dark:border-gray-700">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-gray-400 dark:text-gray-500">
                  <rect x="8" y="8" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 16h24M16 8v24" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">No orders found</p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first walk-in order to get started</p>
              <Button onClick={() => navigate('/employee/walk-in')}>
                Create Walk-In Order
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="cursor-pointer"
                >
                  <OrderCard order={order} />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
