import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { User } from '../types'

interface AuthState {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
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

  setUser: (user) => set({ user }),

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Try to get user data from users table, fallback to auth user
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        
        // If no user record exists, create one
        if (!userData) {
          const newUser = {
            id: session.user.id,
            email: session.user.email,
            phone: session.user.phone,
            display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            password_set: !!session.user.email,
            google_provider_id: session.user.app_metadata?.provider === 'google' ? session.user.id : null,
            created_at: new Date().toISOString(),
          }
          
          await supabase.from('users').insert(newUser)
          set({ user: newUser as User, loading: false })
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
            const newUser = {
              id: session.user.id,
              email: session.user.email,
              phone: session.user.phone,
              display_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              password_set: !!session.user.email,
              google_provider_id: session.user.app_metadata?.provider === 'google' ? session.user.id : null,
              created_at: new Date().toISOString(),
            }
            
            await supabase.from('users').insert(newUser)
            set({ user: newUser as User })
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
        redirectTo: `${window.location.origin}/app/dashboard`,
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
    
    // Create user record if doesn't exist
    if (data.user) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (!existingUser) {
        await supabase.from('users').insert({
          id: data.user.id,
          phone: data.user.phone,
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
