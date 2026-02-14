import type { Address } from '../types'

interface AddressPickerProps {
  addresses: Address[]
  selected: Address | null
  onSelect: (address: Address) => void
  onAddNew: () => void
}

export default function AddressPicker({ addresses, selected, onSelect, onAddNew }: AddressPickerProps) {
  if (addresses.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <path d="M16 6C11.58 6 8 9.58 8 14c0 7.5 8 16 8 16s8-8.5 8-16c0-4.42-3.58-8-8-8z" stroke="#9ca3af" strokeWidth="2" strokeLinejoin="round"/>
            <circle cx="16" cy="14" r="3" stroke="#9ca3af" strokeWidth="2"/>
          </svg>
        </div>
        <p className="text-gray-600 dark:text-gray-400 font-medium mb-4">No saved addresses</p>
        <button 
          onClick={onAddNew}
          className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-semibold text-sm transition-colors"
        >
          + Add New Address
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {addresses.map((address) => (
        <button
          key={address.id}
          onClick={() => onSelect(address)}
          className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${
            selected?.id === address.id
              ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className={selected?.id === address.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}>
                  <path d="M9 3C6.79 3 5 4.79 5 7c0 3.75 4 8 4 8s4-4.25 4-8c0-2.21-1.79-4-4-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span className="font-bold text-gray-900 dark:text-white">{address.label}</span>
                {address.is_default && (
                  <span className="text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full font-semibold">
                    Default
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {address.line1}
                {address.line2 && `, ${address.line2}`}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {address.city}, {address.state}
              </p>
            </div>
            {selected?.id === address.id && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-primary-600 dark:bg-primary-500 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </button>
      ))}
      
      <button
        onClick={onAddNew}
        className="w-full p-5 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary-600 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200 text-center"
      >
        <div className="flex items-center justify-center gap-2 text-primary-600 dark:text-primary-400 font-semibold">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Add New Address
        </div>
      </button>
    </div>
  )
}
