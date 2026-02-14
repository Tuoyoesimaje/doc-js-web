import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import Button from './Button'
import Input from './Input'

interface QuickSignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  prefillPhone?: string
}

type SignupMethod = 'phone' | 'email'

export default function QuickSignupModal({ isOpen, onClose, onSuccess, prefillPhone }: QuickSignupModalProps) {
  const [method, setMethod] = useState<SignupMethod>('phone')
  const [phone, setPhone] = useState(prefillPhone || '')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'input' | 'verify'>('input')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhoneSignup = async () => {
    setError('')
    setLoading(true)
    
    try {
      // Format phone number
      let formattedPhone = phone.trim()
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+234' + formattedPhone.slice(1)
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+234' + formattedPhone
      }

      // Send OTP
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
        options: {
          channel: 'sms',
        },
      })

      if (otpError) throw otpError

      setStep('verify')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    setError('')
    setLoading(true)
    
    try {
      let formattedPhone = phone.trim()
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+234' + formattedPhone.slice(1)
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+234' + formattedPhone
      }

      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otp,
        type: 'sms',
      })

      if (verifyError) throw verifyError

      // Set password
      const { error: passwordError } = await supabase.auth.updateUser({
        password,
      })

      if (passwordError) throw passwordError

      // Wait for user record to be created
      await new Promise(resolve => setTimeout(resolve, 1500))

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignup = async () => {
    setError('')
    setLoading(true)
    
    try {
      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`,
        },
      })

      if (signupError) throw signupError

      // Wait for user record to be created
      await new Promise(resolve => setTimeout(resolve, 1500))

      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError('')
    setLoading(true)
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      })
      
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google')
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Create Account</h2>
                  <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-900 dark:text-white"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 rounded-xl">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                {step === 'input' ? (
                  <div className="space-y-6">
                    {/* Method Toggle */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMethod('phone')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                          method === 'phone'
                            ? 'bg-primary-600 dark:bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Phone
                      </button>
                      <button
                        onClick={() => setMethod('email')}
                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all ${
                          method === 'email'
                            ? 'bg-primary-600 dark:bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        Email
                      </button>
                    </div>

                    {method === 'phone' ? (
                      <>
                        <Input
                          label="Phone Number"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="08012345678"
                        />
                        <Input
                          label="Password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                        />
                        <Button
                          onClick={handlePhoneSignup}
                          loading={loading}
                          disabled={!phone || !password}
                          fullWidth
                        >
                          Send OTP
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          label="Email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                        />
                        <Input
                          label="Password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Create a password"
                        />
                        <Button
                          onClick={handleEmailSignup}
                          loading={loading}
                          disabled={!email || !password}
                          fullWidth
                        >
                          Create Account
                        </Button>
                      </>
                    )}

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t-2 border-gray-200"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-gray-500 font-medium">Or continue with</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleGoogleSignup}
                      loading={loading}
                      variant="secondary"
                      fullWidth
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M18 10.2c0-.7-.1-1.4-.2-2H10v3.8h4.5c-.2 1-.8 1.9-1.7 2.5v2h2.7c1.6-1.5 2.5-3.6 2.5-6.3z" fill="#4285F4"/>
                        <path d="M10 18c2.4 0 4.5-.8 6-2.2l-2.7-2c-.8.5-1.8.9-3.3.9-2.5 0-4.7-1.7-5.4-4H1.8v2.1C3.3 15.8 6.5 18 10 18z" fill="#34A853"/>
                        <path d="M4.6 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5.2H1.8C1.3 6.2 1 7.1 1 8s.3 1.8.8 2.8l2.8-2.1z" fill="#FBBC05"/>
                        <path d="M10 3.6c1.4 0 2.7.5 3.7 1.4l2.7-2.7C14.5.9 12.4 0 10 0 6.5 0 3.3 2.2 1.8 5.2l2.8 2.1C5.3 5.3 7.5 3.6 10 3.6z" fill="#EA4335"/>
                      </svg>
                      Sign up with Google
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-sm text-gray-600">
                      Enter the 6-digit code sent to {phone}
                    </p>
                    <Input
                      label="OTP Code"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="123456"
                      maxLength={6}
                    />
                    <Button
                      onClick={handleVerifyOTP}
                      loading={loading}
                      disabled={otp.length !== 6}
                      fullWidth
                    >
                      Verify & Create Account
                    </Button>
                    <button
                      onClick={() => setStep('input')}
                      className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Back
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
