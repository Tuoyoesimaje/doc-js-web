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
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Quick Order Entry
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Example:&#10;10 shirts&#10;5 trousers&#10;2 suits&#10;1 bedsheet"
          className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-600 outline-none min-h-[180px] font-mono text-base resize-none transition-all duration-200"
        />
        <div className="mt-3 flex items-start gap-2 text-sm text-gray-600">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-primary-600 mt-0.5 flex-shrink-0">
            <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M9 6v3M9 12h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p>
            Enter items like <span className="font-semibold text-gray-900">"10 shirts, 5 trousers"</span> or one per line. 
            We'll automatically detect and price your items.
          </p>
        </div>
      </div>
      <Button onClick={handleParse} disabled={!text.trim()} fullWidth>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        Parse Items
      </Button>
    </div>
  )
}
