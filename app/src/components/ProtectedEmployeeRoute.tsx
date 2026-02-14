import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

interface ProtectedEmployeeRouteProps {
  children: React.ReactNode
}

export default function ProtectedEmployeeRoute({ children }: ProtectedEmployeeRouteProps) {
  const { user } = useAuthStore()
  const [isEmployee, setIsEmployee] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkEmployeeStatus()
  }, [user])

  const checkEmployeeStatus = async () => {
    if (!user) {
      setIsEmployee(false)
      setLoading(false)
      return
    }

    // Check sessionStorage first
    const employeeVerified = sessionStorage.getItem('employee_verified')
    if (employeeVerified === 'true') {
      setIsEmployee(true)
      setLoading(false)
      return
    }

    // Check database
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, is_active')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error

      if (data) {
        sessionStorage.setItem('employee_verified', 'true')
        setIsEmployee(true)
      } else {
        setIsEmployee(false)
      }
    } catch (error) {
      console.error('Failed to check employee status:', error)
      setIsEmployee(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4 mx-auto"></div>
          <p className="text-gray-600 font-medium">Verifying employee access...</p>
        </div>
      </div>
    )
  }

  if (!user || !isEmployee) {
    return <Navigate to="/employee/login" replace />
  }

  return <>{children}</>
}
