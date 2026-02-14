import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  isAdmin: boolean
  setUser: (user: User | null) => void
  setIsAdmin: (isAdmin: boolean) => void
  checkAdminRole: (userId: string) => Promise<boolean>
  signInWithGoogle: () => Promise<void>
  signInWithPhoneFirstTime: (phone: string) => Promise<void>
  verifyPhoneOTP: (phone: string, code: string) => Promise<void>
  setPasswordForPhoneUser: (password: string) => Promise<void>
  signInWithPhonePassword: (phone: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isAdmin: false,

  setUser: (user) => set({ user }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),

  checkAdminRole: async (userId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('users')
      .select('is_admin, role')
      .eq('id', userId)
      .single()
    
    const isAdmin = data?.is_admin === true || data?.role === 'admin'
    set({ isAdmin })
    return isAdmin
  },

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Try to get user data from users table
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        
        // If no user record exists, create one (for existing users before trigger was added)
        if (!userData) {
          const newUser = {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
            display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
            password_set: !!session.user.email,
            google_provider_id: session.user.app_metadata?.provider === 'google' ? session.user.id : null,
            created_at: new Date().toISOString(),
            last_login: new Date().toISOString(),
          }
          
          const { error: insertError } = await supabase.from('users').insert(newUser)
          
          if (insertError) {
            console.error('Failed to create user record:', insertError)
            // If insert fails, wait a moment and try to fetch again (trigger might have created it)
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: retryData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            
            if (retryData) {
              set({ user: retryData, loading: false })
            } else {
              set({ user: null, loading: false })
            }
          } else {
            set({ user: newUser as User, loading: false })
          }
        } else {
          set({ user: userData, loading: false })
        }
      } else {
        set({ user: null, loading: false })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          
          if (!userData) {
            // Wait a moment for trigger to create user record
            await new Promise(resolve => setTimeout(resolve, 1000))
            const { data: retryData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            
            if (retryData) {
              set({ user: retryData })
            } else {
              // Trigger didn't create it, try manual insert
              const newUser = {
                id: session.user.id,
                email: session.user.email,
                phone: session.user.phone,
                display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
                password_set: !!session.user.email,
                google_provider_id: session.user.app_metadata?.provider === 'google' ? session.user.id : null,
                created_at: new Date().toISOString(),
                last_login: new Date().toISOString(),
              }
              
              await supabase.from('users').insert(newUser)
              set({ user: newUser as User })
            }
          } else {
            set({ user: userData })
          }
        } else {
          set({ user: null })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({ loading: false })
    }
  },

  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
      },
    })
    
    if (error) throw error
  },

  signInWithPhoneFirstTime: async (phone: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: 'sms',
      },
    })
    
    if (error) throw error
  },

  verifyPhoneOTP: async (phone: string, code: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    })
    
    if (error) throw error
    
    // Wait for trigger to create user record
    if (data.user) {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle()
      
      if (!existingUser) {
        // Trigger didn't work, create manually
        await supabase.from('users').insert({
          id: data.user.id,
          phone: data.user.phone,
          display_name: data.user.phone,
          password_set: false,
        })
      }
    }
  },

  setPasswordForPhoneUser: async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    })
    
    if (error) throw error
    
    // Update user record
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('users')
        .update({ password_set: true })
        .eq('id', user.id)
    }
  },

  signInWithPhonePassword: async (phone: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      phone,
      password,
    })
    
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ user: null })
  },
}))

// Initialize auth on app load
useAuthStore.getState().initialize()
