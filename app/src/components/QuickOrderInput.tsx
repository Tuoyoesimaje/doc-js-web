import { useState } from 'react'
import Button from './Button'

interface QuickOrderInputProps {
  onParse: (text: string) => void
}

export default function QuickOrderInput({ onParse }: QuickOrderInputProps) {
  const [text, setText] = useState('')

  const handleParse = () => {
    if (text.trim()) {
      onParse(text)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Example: 10 shirts, 5 trousers, 2 suits"
          className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-600 focus:border-primary-600 dark:focus:border-primary-500 outline-none min-h-[100px] text-sm resize-none transition-all duration-200 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
        <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          Enter items like <span className="font-semibold text-gray-900 dark:text-white">"10 shirts, 5 trousers"</span> or one per line
        </p>
      </div>
      <Button onClick={handleParse} disabled={!text.trim()} fullWidth size="sm">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Add Items
      </Button>
    </div>
  )
}
