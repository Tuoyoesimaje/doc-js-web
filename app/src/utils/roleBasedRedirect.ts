import { supabase } from '../lib/supabase'

export async function getRoleBasedRedirect(userId: string): Promise<string> {
  try {
    // Check if user is an employee
    const { data: employeeData } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    if (employeeData) {
      return '/employee'
    }

    // Check if user is an admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin, role')
      .eq('id', userId)
      .single()

    if (userData?.is_admin === true || userData?.role === 'admin') {
      return '/admin'
    }

    // Default to customer dashboard
    return '/dashboard'
  } catch (error) {
    console.error('Error checking user role:', error)
    return '/dashboard'
  }
}
