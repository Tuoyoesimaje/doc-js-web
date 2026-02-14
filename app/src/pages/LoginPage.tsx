import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { getRoleBasedRedirect } from '../utils/roleBasedRedirect'
import Button from '../components/Button'
import Input from '../components/Input'

type LoginMode = 'email' | 'phone' | 'google'

export default function LoginPage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<LoginMode>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    signInWithGoogle,
    signInWithPhonePassword,
  } = useAuthStore()

  const handlePhoneLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithPhonePassword(phone, password)
      
      // Get current user and redirect based on role
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const redirectPath = await getRoleBasedRedirect(user.id)
        navigate(redirectPath)
      }
    } catch (err: any) {
      setError(err.message || 'Invalid phone or password')
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err: any) {
      const message = err.message || 'Google login failed'
      if (message.includes('provider is not enabled')) {
        setError('Google login is not enabled yet. Please use email/password or contact support.')
      } else {
        setError(message)
      }
      setLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      // Check if user is admin
      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('is_admin, role')
          .eq('id', data.user.id)
          .single()

        if (userData?.is_admin === true || userData?.role === 'admin') {
          sessionStorage.setItem('admin_verified', 'true')
          
          await supabase
            .from('users')
            .update({ last_admin_login: new Date().toISOString() })
            .eq('id', data.user.id)
        }

        // Redirect based on role
        const redirectPath = await getRoleBasedRedirect(data.user.id)
        navigate(redirectPath)
      }
      
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-primary-600 rounded-3xl mb-6 shadow-xl"
          >
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="10" y="14" width="20" height="18" rx="2" stroke="white" strokeWidth="2.5"/>
              <path d="M14 10v8M26 10v8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="18" cy="24" r="2" fill="white"/>
              <circle cx="22" cy="24" r="2" fill="white"/>
            </svg>
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-gray-900 mb-3 tracking-tight">
            Welcome Back
          </h1>
          <p className="text-lg text-gray-600">
            Sign in to manage your laundry orders
          </p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl border-2 border-gray-100 p-8"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl text-red-700 text-sm font-medium"
            >
              {error}
            </motion.div>
          )}

          {mode === 'email' && (
            <div className="space-y-5">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={handleEmailLogin} loading={loading} fullWidth>
                Sign In
              </Button>
              
              <div className="text-center">
                <Link
                  to="/signup"
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                >
                  Don't have an account? Sign up
                </Link>
              </div>
              
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setMode('phone')}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all duration-200 font-semibold text-gray-700"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <rect x="6" y="2" width="8" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M10 15h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Phone
                </button>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:border-primary-600 hover:bg-primary-50 transition-all duration-200 font-semibold text-gray-700 disabled:opacity-50"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z"/>
                    <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z"/>
                    <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z"/>
                    <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z"/>
                  </svg>
                  Google
                </button>
              </div>
            </div>
          )}

          {mode === 'phone' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="+234 XXX XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button onClick={handlePhoneLogin} loading={loading} fullWidth>
                Sign In with Phone
              </Button>
              <button
                onClick={() => setMode('email')}
                className="w-full text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                ← Back to email login
              </button>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          By continuing, you agree to our{' '}
          <a href="/policies.html" className="text-primary-600 hover:text-primary-700 font-semibold">
            Terms & Privacy Policy
          </a>
        </p>
      </motion.div>
    </div>
  )
}
