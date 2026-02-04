import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import Button from './Button'
import Input from './Input'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

type VerificationStep = 'profile' | 'verify-phone' | 'verify-email'

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<VerificationStep>('profile')
  
  // Profile fields
  const [displayName, setDisplayName] = useState(user?.display_name || '')
  const [newPhone, setNewPhone] = useState('')
  const [newEmail, setNewEmail] = useState('')
  
  // Verification
  const [otpCode, setOtpCode] = useState('')
  const [verificationSent, setVerificationSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: displayName })
        .eq('id', user!.id)

      if (error) throw error

      setUser({ ...user!, display_name: displayName })
      onClose()
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      alert(`Failed to update profile: ${error.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSendPhoneOTP = async () => {
    if (!newPhone || newPhone.length < 10) {
      alert('Please enter a valid phone number')
      return
    }

    setLoading(true)
    try {
      // Format phone number (add +234 if not present)
      const formattedPhone = newPhone.startsWith('+') ? newPhone : `+234${newPhone.replace(/^0/, '')}`
      
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      })

      if (error) throw error

      setVerificationSent(true)
      alert('OTP sent to your phone!')
    } catch (error: any) {
      console.error('Failed to send OTP:', error)
      alert(`Failed to send OTP: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPhoneOTP = async () => {
    if (!otpCode || otpCode.length !== 6) {
      alert('Please enter the 6-digit OTP code')
      return
    }

    setLoading(true)
    try {
      const formattedPhone = newPhone.startsWith('+') ? newPhone : `+234${newPhone.replace(/^0/, '')}`
      
      const { error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: otpCode,
        type: 'sms',
      })

      if (error) throw error

      // Update user phone in database
      await supabase
        .from('users')
        .update({ phone: formattedPhone })
        .eq('id', user!.id)

      setUser({ ...user!, phone: formattedPhone })
      setStep('profile')
      setNewPhone('')
      setOtpCode('')
      setVerificationSent(false)
      alert('Phone number verified successfully!')
    } catch (error: any) {
      console.error('Failed to verify OTP:', error)
      alert(`Failed to verify OTP: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmailVerification = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      })

      if (error) throw error

      alert('Verification email sent! Please check your inbox and click the link to verify.')
      setStep('profile')
      setNewEmail('')
    } catch (error: any) {
      console.error('Failed to send verification email:', error)
      alert(`Failed to send verification email: ${error.message}`)
    } finally {
      setLoading(false)
    }
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
                  className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl mb-4 shadow-xl"
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="12" r="5" stroke="white" strokeWidth="2.5"/>
                    <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                </motion.div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                  {step === 'profile' ? 'Edit Profile' : step === 'verify-phone' ? 'Verify Phone' : 'Verify Email'}
                </h2>
                <p className="text-gray-600">
                  {step === 'profile' ? 'Update your personal information' : 'Complete verification to continue'}
                </p>
              </div>

              {/* Profile Step */}
              {step === 'profile' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Input
                    label="Display Name"
                    placeholder="Enter your full name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />

                  {/* Contact Information */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700">Contact Information</label>
                    
                    {/* Email */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="font-semibold text-gray-900">{user?.email || 'Not set'}</p>
                      </div>
                      {!user?.email && (
                        <button
                          type="button"
                          onClick={() => setStep('verify-email')}
                          className="text-sm font-bold text-primary-600 hover:text-primary-700"
                        >
                          Add
                        </button>
                      )}
                    </div>

                    {/* Phone */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="font-semibold text-gray-900">{user?.phone || 'Not set'}</p>
                      </div>
                      {!user?.phone && (
                        <button
                          type="button"
                          onClick={() => setStep('verify-phone')}
                          className="text-sm font-bold text-primary-600 hover:text-primary-700"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="secondary"
                      fullWidth
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={loading}
                      fullWidth
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              )}

              {/* Phone Verification Step */}
              {step === 'verify-phone' && (
                <div className="space-y-5">
                  {!verificationSent ? (
                    <>
                      <Input
                        label="Phone Number"
                        placeholder="08012345678"
                        value={newPhone}
                        onChange={(e) => setNewPhone(e.target.value)}
                        type="tel"
                      />
                      <p className="text-sm text-gray-600">
                        We'll send you a 6-digit OTP code to verify your number
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setStep('profile')}
                          variant="secondary"
                          fullWidth
                        >
                          Back
                        </Button>
                        <Button
                          onClick={handleSendPhoneOTP}
                          loading={loading}
                          fullWidth
                        >
                          Send OTP
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Input
                        label="Enter OTP Code"
                        placeholder="123456"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                      />
                      <p className="text-sm text-gray-600">
                        Enter the 6-digit code sent to {newPhone}
                      </p>
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setVerificationSent(false)}
                          variant="secondary"
                          fullWidth
                        >
                          Resend
                        </Button>
                        <Button
                          onClick={handleVerifyPhoneOTP}
                          loading={loading}
                          fullWidth
                        >
                          Verify
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Email Verification Step */}
              {step === 'verify-email' && (
                <div className="space-y-5">
                  <Input
                    label="Email Address"
                    placeholder="your@email.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    type="email"
                  />
                  <p className="text-sm text-gray-600">
                    We'll send you a verification link to confirm your email
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setStep('profile')}
                      variant="secondary"
                      fullWidth
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSendEmailVerification}
                      loading={loading}
                      fullWidth
                    >
                      Send Link
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
