import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'
import Button from './Button'
import Input from './Input'

interface AddAddressModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddAddressModal({ isOpen, onClose, onSuccess }: AddAddressModalProps) {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    label: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    isDefault: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // First, ensure user record exists in users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user!.id)
        .maybeSingle()

      if (!existingUser) {
        // Get current auth user details
        const { data: { user: authUser } } = await supabase.auth.getUser()
        
        if (authUser) {
          // Create user record
          const { error: userError } = await supabase.from('users').insert({
            id: authUser.id,
            email: authUser.email,
            phone: authUser.phone,
            display_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || authUser.phone || 'User',
            password_set: !!authUser.email,
            google_provider_id: authUser.app_metadata?.provider === 'google' ? authUser.id : null,
          })

          if (userError) {
            console.error('Failed to create user record:', userError)
            throw new Error('Please refresh the page and try again.')
          }

          // Wait a moment for the insert to complete
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // If setting as default, unset other defaults first
      if (formData.isDefault) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user!.id)
          .eq('is_default', true)
      }

      const { error } = await supabase.from('addresses').insert({
        user_id: user!.id,
        label: formData.label,
        line1: formData.line1,
        line2: formData.line2 || null,
        city: formData.city,
        state: formData.state,
        is_default: formData.isDefault,
      })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      onSuccess()
      onClose()
      setFormData({
        label: '',
        line1: '',
        line2: '',
        city: '',
        state: '',
        isDefault: false,
      })
    } catch (error: any) {
      console.error('Failed to add address:', error)
      alert(`Failed to add address: ${error.message || 'Please try again.'}`)
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
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 my-8"
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
                    <path d="M16 6C11.58 6 8 9.58 8 14c0 7.5 8 16 8 16s8-8.5 8-16c0-4.42-3.58-8-8-8z" stroke="white" strokeWidth="2.5" strokeLinejoin="round"/>
                    <circle cx="16" cy="14" r="3" stroke="white" strokeWidth="2.5"/>
                  </svg>
                </motion.div>
                <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">
                  Add New Address
                </h2>
                <p className="text-gray-600">
                  Save your delivery address for faster checkout
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Address Label"
                  placeholder="e.g., Home, Office, etc."
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  required
                />

                <Input
                  label="Street Address"
                  placeholder="House number and street name"
                  value={formData.line1}
                  onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                  required
                />

                <Input
                  label="Apartment, suite, etc. (optional)"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  value={formData.line2}
                  onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="City"
                    placeholder="Warri"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    required
                  />

                  <Input
                    label="State"
                    placeholder="Delta"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    required
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                  />
                  <div>
                    <span className="font-semibold text-gray-900">Set as default address</span>
                    <p className="text-sm text-gray-600">Use this address for all future orders</p>
                  </div>
                </label>

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
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Add Address
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
