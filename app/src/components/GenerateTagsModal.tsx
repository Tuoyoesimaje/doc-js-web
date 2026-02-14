import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createGarmentTagsForOrder } from '../utils/garmentTags'
import type { Order, OrderItem, GarmentTag } from '../types'
import Button from './Button'

interface GenerateTagsModalProps {
  isOpen: boolean
  onClose: () => void
  order: Order
  onSuccess: (tags: GarmentTag[]) => void
}

export default function GenerateTagsModal({ isOpen, onClose, order, onSuccess }: GenerateTagsModalProps) {
  const [loading, setLoading] = useState(false)
  const [generatedTags, setGeneratedTags] = useState<GarmentTag[]>([])
  const [step, setStep] = useState<'confirm' | 'generated'>('confirm')

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const items = (order.items || []).map((item: OrderItem) => ({
        orderItemId: item.id,
        serviceName: item.service?.name || item.description,
        quantity: item.quantity,
      }))

      const tags = await createGarmentTagsForOrder(
        order.id,
        items,
        order.user?.display_name,
        order.user?.phone
      )

      setGeneratedTags(tags)
      setStep('generated')
      onSuccess(tags)
    } catch (error) {
      console.error('Failed to generate tags:', error)
      alert('Failed to generate tags. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    // Create printable content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Garment Tags - ${order.id}</title>
        <style>
          @page { size: 4in 2in; margin: 0; }
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0;
          }
          .tag {
            width: 4in;
            height: 2in;
            padding: 0.25in;
            page-break-after: always;
            border: 2px solid #000;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .tag-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 0.1in;
            margin-bottom: 0.1in;
          }
          .tag-number {
            font-size: 24pt;
            font-weight: bold;
            letter-spacing: 2px;
          }
          .tag-body {
            flex: 1;
          }
          .tag-row {
            margin: 0.05in 0;
            font-size: 10pt;
          }
          .tag-label {
            font-weight: bold;
            display: inline-block;
            width: 1in;
          }
          .tag-footer {
            text-align: center;
            font-size: 8pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 0.05in;
          }
        </style>
      </head>
      <body>
        ${generatedTags.map(tag => `
          <div class="tag">
            <div class="tag-header">
              <div style="font-size: 14pt; font-weight: bold;">DOC JS LAUNDRY</div>
              <div class="tag-number">${tag.tag_number}</div>
            </div>
            <div class="tag-body">
              <div class="tag-row">
                <span class="tag-label">Item:</span>
                <span>${tag.service_name}</span>
              </div>
              <div class="tag-row">
                <span class="tag-label">Customer:</span>
                <span>${tag.customer_name || 'N/A'}</span>
              </div>
              <div class="tag-row">
                <span class="tag-label">Phone:</span>
                <span>${tag.customer_phone || 'N/A'}</span>
              </div>
              <div class="tag-row">
                <span class="tag-label">Date:</span>
                <span>${new Date(tag.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div class="tag-footer">
              Scan or enter tag number to track your item
            </div>
          </div>
        `).join('')}
      </body>
      </html>
    `

    // Open print window
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(printContent)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const handleClose = () => {
    setStep('confirm')
    setGeneratedTags([])
    onClose()
  }

  const totalItems = (order.items || []).reduce((sum, item) => sum + item.quantity, 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-display font-bold text-gray-900">
                    {step === 'confirm' ? 'Generate Garment Tags' : 'Tags Generated'}
                  </h2>
                  <button
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                {step === 'confirm' ? (
                  <div className="space-y-6">
                    <div className="bg-primary-50 border-2 border-primary-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2"/>
                            <path d="M10 6v4M10 14h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">Generate {totalItems} Tags</h3>
                          <p className="text-sm text-gray-700">
                            This will create unique tag numbers for each item in this order. Tags can be printed and attached to garments for tracking.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-900">Order Items</h3>
                      {(order.items || []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-medium text-gray-900">{item.service?.name || item.description}</p>
                            <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                          </div>
                          <span className="text-sm font-bold text-primary-600">
                            {item.quantity} tag{item.quantity > 1 ? 's' : ''}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={handleClose} fullWidth>
                        Cancel
                      </Button>
                      <Button onClick={handleGenerate} loading={loading} fullWidth>
                        Generate Tags
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="2"/>
                            <path d="M7 10l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">Successfully Generated {generatedTags.length} Tags</h3>
                          <p className="text-sm text-gray-700">
                            Tags have been created and saved. You can now print them or view them in the order details.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2">
                      {generatedTags.map((tag) => (
                        <div key={tag.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-mono font-bold text-gray-900">{tag.tag_number}</p>
                            <p className="text-sm text-gray-600">{tag.service_name}</p>
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(tag.tag_number)}
                            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
                          >
                            Copy
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <Button variant="secondary" onClick={handleClose} fullWidth>
                        Close
                      </Button>
                      <Button onClick={handlePrint} fullWidth>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M5 7V3h10v4M5 13H3a1 1 0 01-1-1V8a1 1 0 011-1h14a1 1 0 011 1v4a1 1 0 01-1 1h-2" stroke="currentColor" strokeWidth="2"/>
                          <rect x="5" y="11" width="10" height="6" rx="1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Print Tags
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
