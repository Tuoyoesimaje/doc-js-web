import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'

export default function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        navigate('/')
        return
      }

      // Check if admin verified in session
      const adminVerified = sessionStorage.getItem('admin_verified')
      if (!adminVerified) {
        navigate('/')
        return
      }

      // Check admin role in database
      const { data } = await supabase
        .from('users')
        .select('is_admin, role')
        .eq('id', user.id)
        .single()

      if (data?.is_admin !== true && data?.role !== 'admin') {
        navigate('/')
        return
      }

      setIsAdmin(true)
      setLoading(false)
    }

    checkAdmin()
  }, [user, navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Verifying admin access...</p>
        </div>
      </div>
    )
  }

  return isAdmin ? <>{children}</> : null
}
