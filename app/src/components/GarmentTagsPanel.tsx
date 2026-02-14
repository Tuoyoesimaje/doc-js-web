import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getGarmentTagsForOrder, updateGarmentTagStatus, searchGarmentTag } from '../utils/garmentTags'
import type { GarmentTag, GarmentTagStatus } from '../types'
import Button from './Button'
import Input from './Input'

interface GarmentTagsPanelProps {
  orderId?: string
}

const STATUS_COLORS: Record<GarmentTagStatus, string> = {
  received: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  ready: 'bg-green-100 text-green-700',
  delivered: 'bg-gray-100 text-gray-700',
}

const STATUS_LABELS: Record<GarmentTagStatus, string> = {
  received: 'Received',
  processing: 'Processing',
  ready: 'Ready',
  delivered: 'Delivered',
}

export default function GarmentTagsPanel({ orderId }: GarmentTagsPanelProps) {
  const [tags, setTags] = useState<GarmentTag[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<GarmentTag | null>(null)
  const [searchMode, setSearchMode] = useState(false)

  useEffect(() => {
    if (orderId && !searchMode) {
      loadTags()
    }
  }, [orderId, searchMode])

  const loadTags = async () => {
    if (!orderId) return
    
    setLoading(true)
    try {
      const data = await getGarmentTagsForOrder(orderId)
      setTags(data)
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    try {
      const result = await searchGarmentTag(searchQuery.trim())
      setSearchResult(result)
      setSearchMode(true)
    } catch (error) {
      console.error('Failed to search tag:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (tagNumber: string, newStatus: GarmentTagStatus) => {
    try {
      await updateGarmentTagStatus(tagNumber, newStatus)
      
      if (searchMode && searchResult) {
        setSearchResult({ ...searchResult, status: newStatus })
      } else {
        loadTags()
      }
    } catch (error) {
      console.error('Failed to update tag status:', error)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchResult(null)
    setSearchMode(false)
  }

  const renderTag = (tag: GarmentTag) => (
    <motion.div
      key={tag.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border-2 border-gray-100 p-4 hover:border-primary-200 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-display font-bold text-gray-900">{tag.tag_number}</span>
            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${STATUS_COLORS[tag.status]}`}>
              {STATUS_LABELS[tag.status]}
            </span>
          </div>
          <p className="text-sm text-gray-600">{tag.service_name}</p>
        </div>
        <button
          onClick={() => {
            // Copy to clipboard
            navigator.clipboard.writeText(tag.tag_number)
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          title="Copy tag number"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="5" width="9" height="9" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 11V3a1 1 0 011-1h8" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </button>
      </div>

      {tag.customer_name && (
        <div className="mb-2">
          <p className="text-xs text-gray-500">Customer</p>
          <p className="text-sm font-medium text-gray-900">{tag.customer_name}</p>
        </div>
      )}

      {tag.notes && (
        <div className="mb-3">
          <p className="text-xs text-gray-500">Notes</p>
          <p className="text-sm text-gray-700">{tag.notes}</p>
        </div>
      )}

      <div className="flex gap-2">
        {(['received', 'processing', 'ready', 'delivered'] as GarmentTagStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => handleUpdateStatus(tag.tag_number, status)}
            disabled={tag.status === status}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
              tag.status === status
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>
    </motion.div>
  )

  if (loading && tags.length === 0 && !searchResult) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="bg-white rounded-xl border-2 border-gray-100 p-4">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tag number (e.g., DJS-250115-0001)"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} loading={loading}>
            Search
          </Button>
          {searchMode && (
            <Button variant="secondary" onClick={handleClearSearch}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Search Result */}
      {searchMode && searchResult && (
        <div>
          <h3 className="text-lg font-display font-bold text-gray-900 mb-4">Search Result</h3>
          {renderTag(searchResult)}
        </div>
      )}

      {searchMode && !searchResult && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M20 20l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-gray-600">No tag found with that number</p>
        </div>
      )}

      {/* Order Tags */}
      {!searchMode && orderId && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-display font-bold text-gray-900">
              Garment Tags ({tags.length})
            </h3>
            <button
              onClick={loadTags}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              Refresh
            </button>
          </div>

          {tags.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="8" y="8" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 12h8M12 16h8M12 20h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-gray-600">No garment tags for this order yet</p>
              <p className="text-sm text-gray-500 mt-1">Tags will be generated when items are received</p>
            </div>
          ) : (
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {tags.map((tag) => renderTag(tag))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {!searchMode && !orderId && (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-600">Select an order to view garment tags</p>
        </div>
      )}
    </div>
  )
}
