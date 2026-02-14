import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { getRoleBasedRedirect } from '../utils/roleBasedRedirect'

export default function RoleBasedRedirect() {
  const { user } = useAuthStore()
  const [redirectPath, setRedirectPath] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      getRoleBasedRedirect(user.id).then(setRedirectPath)
    }
  }, [user])

  if (!redirectPath) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return <Navigate to={redirectPath} replace />
}
