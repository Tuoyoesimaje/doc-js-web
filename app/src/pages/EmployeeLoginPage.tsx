import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import Input from '../components/Input'

export default function EmployeeLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Check if user is an employee
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*, pickup_location:pickup_locations(*)')
        .eq('user_id', authData.user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (employeeError) throw employeeError

      if (!employeeData) {
        setError('You are not registered as an employee')
        await supabase.auth.signOut()
        return
      }

      // Store employee info in sessionStorage
      sessionStorage.setItem('employee_verified', 'true')
      sessionStorage.setItem('employee_data', JSON.stringify(employeeData))

      // Redirect to employee portal
      navigate('/employee')
    } catch (err: any) {
      setError(err.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-primary-600 to-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 5h4v2h-4V5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">Employee Portal</h1>
          <p className="text-gray-600">Sign in to manage walk-in orders</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-3xl border-2 border-gray-100 p-8 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@docjslaundry.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="lg"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z" stroke="currentColor" strokeWidth="2"/>
                <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t-2 border-gray-100">
            <button
              onClick={() => navigate('/')}
              className="w-full text-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to main site
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-primary-50 border-2 border-primary-200 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2"/>
                <path d="M10 6v4M10 14h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 mb-1">Employee Access Only</h3>
              <p className="text-sm text-gray-700">
                This portal is for Doc JS Laundry staff members. If you're a customer, please use the main customer portal.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
