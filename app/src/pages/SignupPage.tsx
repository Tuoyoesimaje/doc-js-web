import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import Button from '../components/Button'
import Input from '../components/Input'

type SignupMode = 'email' | 'phone' | 'google' | 'otp-verify' | 'set-password'

export default function SignupPage() {
  const [mode, setMode] = useState<SignupMode>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    signInWithGoogle,
    signInWithPhoneFirstTime,
    verifyPhoneOTP,
    setPasswordForPhoneUser,
  } = useAuthStore()

  const handleEmailSignup = async () => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName || email.split('@')[0],
          },
        },
      })
      if (error) throw error
      setError('Success! Check your email for confirmation link.')
    } catch (err: any) {
      setError(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneSignup = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithPhoneFirstTime(phone)
      setMode('otp-verify')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPVerify = async () => {
    setLoading(true)
    setError('')
    try {
      await verifyPhoneOTP(phone, otp)
      setMode('set-password')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleSetPassword = async () => {
    setLoading(true)
    setError('')
    try {
      await setPasswordForPhoneUser(password)
      // User will be redirected by App.tsx after auth state updates
    } catch (err: any) {
      setError(err.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
    } catch (err: any) {
      const message = err.message || 'Google signup failed'
      if (message.includes('provider is not enabled')) {
        setError('Google signup is not enabled yet. Please use email/password or contact support.')
      } else {
        setError(message)
      }
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
            Create Account
          </h1>
          <p className="text-lg text-gray-600">
            Join Doc JS Laundry today
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
              className={`mb-6 p-4 border-2 rounded-xl text-sm font-medium ${
                error.includes('Success') 
                  ? 'bg-accent-50 border-accent-200 text-accent-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {error}
            </motion.div>
          )}

          {mode === 'email' && (
            <div className="space-y-5">
              <Input
                type="text"
                placeholder="Full Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={handleEmailSignup} loading={loading} fullWidth>
                Create Account
              </Button>
              
              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
                >
                  Already have an account? Sign in
                </Link>
              </div>
              
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">Or sign up with</span>
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
                  onClick={handleGoogleSignup}
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
              <Button onClick={handlePhoneSignup} loading={loading} fullWidth>
                Send Verification Code
              </Button>
              <button
                onClick={() => setMode('email')}
                className="w-full text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                ← Back to email signup
              </button>
            </div>
          )}

          {mode === 'otp-verify' && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-2xl mb-4">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4v8M16 20v8M8 16H4M28 16h-4M22.36 9.64l-2.83 2.83M12.47 19.53l-2.83 2.83M9.64 9.64l2.83 2.83M19.53 19.53l2.83 2.83" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                  Enter Verification Code
                </h3>
                <p className="text-sm text-gray-600">
                  We sent a 6-digit code to<br/>
                  <span className="font-semibold text-gray-900">{phone}</span>
                </p>
              </div>
              <Input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-bold"
              />
              <Button onClick={handleOTPVerify} loading={loading} fullWidth>
                Verify Code
              </Button>
              <button
                onClick={() => setMode('email')}
                className="w-full text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors"
              >
                ← Back to signup
              </button>
            </div>
          )}

          {mode === 'set-password' && (
            <div className="space-y-5">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-2xl mb-4">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M16 4C11.58 4 8 7.58 8 12v4H6v12h20V16h-2v-4c0-4.42-3.58-8-8-8z" stroke="#10b981" strokeWidth="2.5" strokeLinejoin="round"/>
                    <circle cx="16" cy="22" r="2" fill="#10b981"/>
                  </svg>
                </div>
                <h3 className="text-xl font-display font-bold text-gray-900 mb-2">
                  Set Your Password
                </h3>
                <p className="text-sm text-gray-600">
                  Create a password for faster login next time
                </p>
              </div>
              <Input
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button onClick={handleSetPassword} loading={loading} fullWidth>
                Set Password & Continue
              </Button>
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
