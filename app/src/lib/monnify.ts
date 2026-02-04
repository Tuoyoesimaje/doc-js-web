// Monnify Payment Integration

interface MonnifyConfig {
  apiKey: string
  contractCode: string
  amount: number
  customerName: string
  customerEmail: string
  paymentReference: string
  paymentDescription: string
  onComplete: (response: any) => void
  onClose: () => void
}

declare global {
  interface Window {
    MonnifySDK: {
      initialize: (config: any) => void
    }
  }
}

export const initializeMonnifyPayment = (config: MonnifyConfig) => {
  if (!window.MonnifySDK) {
    console.error('Monnify SDK not loaded')
    return
  }

  window.MonnifySDK.initialize({
    amount: config.amount,
    currency: 'NGN',
    reference: config.paymentReference,
    customerName: config.customerName,
    customerEmail: config.customerEmail,
    apiKey: config.apiKey,
    contractCode: config.contractCode,
    paymentDescription: config.paymentDescription,
    isTestMode: import.meta.env.DEV, // Use test mode in development
    metadata: {
      name: config.customerName,
      email: config.customerEmail,
    },
    onComplete: (response: any) => {
      console.log('Payment completed:', response)
      config.onComplete(response)
    },
    onClose: () => {
      console.log('Payment modal closed')
      config.onClose()
    },
  })
}

export const generatePaymentReference = () => {
  return `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}
