import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import NewOrderPage from './pages/NewOrderPage'
import GuestOrderPage from './pages/GuestOrderPage'
import OrderDetailPage from './pages/OrderDetailPage'
import AdminPanel from './pages/AdminPanel'
import EmployeeLoginPage from './pages/EmployeeLoginPage'
import EmployeePortal from './pages/EmployeePortal'
import WalkInOrderPage from './pages/WalkInOrderPage'
import ProtectedAdminRoute from './components/ProtectedAdminRoute'
import ProtectedEmployeeRoute from './components/ProtectedEmployeeRoute'
import RoleBasedRedirect from './components/RoleBasedRedirect'

function App() {
  const { user, loading } = useAuthStore()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <BrowserRouter basename="/app">
      <Routes>
        <Route path="/order" element={<GuestOrderPage />} />
        <Route path="/login" element={!user ? <LoginPage /> : <RoleBasedRedirect />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <RoleBasedRedirect />} />
        <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/new-order" element={user ? <NewOrderPage /> : <Navigate to="/login" />} />
        <Route path="/orders/:id" element={user ? <OrderDetailPage /> : <Navigate to="/login" />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedAdminRoute>
              <AdminPanel />
            </ProtectedAdminRoute>
          } 
        />
        <Route path="/employee/login" element={<EmployeeLoginPage />} />
        <Route 
          path="/employee" 
          element={
            <ProtectedEmployeeRoute>
              <EmployeePortal />
            </ProtectedEmployeeRoute>
          } 
        />
        <Route 
          path="/employee/walk-in" 
          element={
            <ProtectedEmployeeRoute>
              <WalkInOrderPage />
            </ProtectedEmployeeRoute>
          } 
        />
        <Route path="/" element={user ? <RoleBasedRedirect /> : <Navigate to="/order" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
