import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NewOrderPage from './pages/NewOrderPage'
import OrderDetailPage from './pages/OrderDetailPage'
import AdminPanel from './pages/AdminPanel'

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
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
        <Route path="/new-order" element={user ? <NewOrderPage /> : <Navigate to="/login" />} />
        <Route path="/orders/:id" element={user ? <OrderDetailPage /> : <Navigate to="/login" />} />
        <Route path="/admin" element={user ? <AdminPanel /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
