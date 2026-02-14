import { supabase } from '../lib/supabase'

export async function getRoleBasedRedirect(userId: string): Promise<string> {
  try {
    // Check if user is an admin first (simpler query, no RLS issues)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin, role')
      .eq('id', userId)
      .single()

    if (!userError && (userData?.is_admin === true || userData?.role === 'admin')) {
      return '/admin'
    }

    // Check if user is an employee
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle()

    // If there's an error (like RLS issues), log it but continue
    if (employeeError) {
      console.error('Error checking employee status:', employeeError)
    }

    if (employeeData) {
      return '/employee'
    }

    // Default to customer dashboard
    return '/dashboard'
  } catch (error) {
    console.error('Error checking user role:', error)
    return '/dashboard'
  }
}
