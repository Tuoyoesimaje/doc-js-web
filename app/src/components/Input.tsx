import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3.5 border-2 rounded-xl outline-none transition-all duration-200 text-base
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 dark:border-red-700 dark:focus:border-red-500' : 'border-gray-200 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:focus:border-primary-500 dark:focus:ring-primary-900'}
              ${icon ? 'pl-12' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
