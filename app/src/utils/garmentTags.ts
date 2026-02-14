import { supabase } from '../lib/supabase'
import type { GarmentTag, GarmentTagStatus } from '../types'

/**
 * Generate a tag number for today
 * Format: DJS-YYMMDD-XXXX
 */
export const generateTagNumber = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_tag_number')
  
  if (error) {
    console.error('Failed to generate tag number:', error)
    throw error
  }
  
  return data as string
}

/**
 * Generate multiple tag numbers
 */
export const generateMultipleTagNumbers = async (count: number): Promise<string[]> => {
  const tags: string[] = []
  
  for (let i = 0; i < count; i++) {
    const tag = await generateTagNumber()
    tags.push(tag)
  }
  
  return tags
}

/**
 * Create garment tags for an order
 */
export const createGarmentTagsForOrder = async (
  orderId: string,
  items: Array<{
    orderItemId: string
    serviceName: string
    quantity: number
  }>,
  customerName?: string,
  customerPhone?: string
): Promise<GarmentTag[]> => {
  const tags: GarmentTag[] = []
  
  for (const item of items) {
    for (let i = 0; i < item.quantity; i++) {
      const tagNumber = await generateTagNumber()
      
      const { data, error } = await supabase
        .from('garment_tags')
        .insert({
          tag_number: tagNumber,
          order_id: orderId,
          order_item_id: item.orderItemId,
          service_name: item.serviceName,
          customer_name: customerName,
          customer_phone: customerPhone,
          status: 'received',
        })
        .select()
        .single()
      
      if (error) {
        console.error('Failed to create garment tag:', error)
        throw error
      }
      
      tags.push(data)
    }
  }
  
  return tags
}

/**
 * Get garment tags for an order
 */
export const getGarmentTagsForOrder = async (orderId: string): Promise<GarmentTag[]> => {
  const { data, error } = await supabase
    .from('garment_tags')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Failed to fetch garment tags:', error)
    throw error
  }
  
  return data || []
}

/**
 * Search for a garment tag by tag number
 */
export const searchGarmentTag = async (tagNumber: string): Promise<GarmentTag | null> => {
  const { data, error } = await supabase
    .from('garment_tags')
    .select('*')
    .eq('tag_number', tagNumber)
    .maybeSingle()
  
  if (error) {
    console.error('Failed to search garment tag:', error)
    throw error
  }
  
  return data
}

/**
 * Update garment tag status
 */
export const updateGarmentTagStatus = async (
  tagNumber: string,
  status: GarmentTagStatus,
  notes?: string
): Promise<GarmentTag> => {
  const updateData: any = { status }
  if (notes) updateData.notes = notes
  
  const { data, error } = await supabase
    .from('garment_tags')
    .update(updateData)
    .eq('tag_number', tagNumber)
    .select()
    .single()
  
  if (error) {
    console.error('Failed to update garment tag:', error)
    throw error
  }
  
  return data
}

/**
 * Update multiple garment tags status
 */
export const updateMultipleTagsStatus = async (
  tagNumbers: string[],
  status: GarmentTagStatus,
  notes?: string
): Promise<void> => {
  const updateData: any = { status }
  if (notes) updateData.notes = notes
  
  const { error } = await supabase
    .from('garment_tags')
    .update(updateData)
    .in('tag_number', tagNumbers)
  
  if (error) {
    console.error('Failed to update garment tags:', error)
    throw error
  }
}

/**
 * Get all tags with a specific status
 */
export const getTagsByStatus = async (status: GarmentTagStatus): Promise<GarmentTag[]> => {
  const { data, error } = await supabase
    .from('garment_tags')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch tags by status:', error)
    throw error
  }
  
  return data || []
}

/**
 * Format tag number for display
 */
export const formatTagNumber = (tagNumber: string): string => {
  // Already in correct format: DJS-YYMMDD-XXXX
  return tagNumber
}

/**
 * Parse tag number to get date and sequence
 */
export const parseTagNumber = (tagNumber: string): { date: string; sequence: number } | null => {
  const match = tagNumber.match(/^DJS-(\d{6})-(\d{4})$/)
  if (!match) return null
  
  const [, dateStr, seqStr] = match
  const year = '20' + dateStr.substring(0, 2)
  const month = dateStr.substring(2, 4)
  const day = dateStr.substring(4, 6)
  
  return {
    date: `${year}-${month}-${day}`,
    sequence: parseInt(seqStr, 10),
  }
}

/**
 * Generate printable tag data
 */
export const generatePrintableTag = (tag: GarmentTag) => {
  return {
    tagNumber: tag.tag_number,
    serviceName: tag.service_name,
    customerName: tag.customer_name || 'N/A',
    customerPhone: tag.customer_phone || 'N/A',
    date: new Date(tag.created_at).toLocaleDateString(),
    qrData: tag.tag_number, // Can be used to generate QR code
  }
}
