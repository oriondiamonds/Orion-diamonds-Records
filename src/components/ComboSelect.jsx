import { useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'

/**
 * Dropdown with preset options + free-text "Other" fallback.
 * Props:
 *   options   string[]   — preset list
 *   value     string     — controlled value
 *   onChange  fn(value)
 *   placeholder string
 */
export default function ComboSelect({ options, value, onChange, placeholder = '' }) {
  const isCustom = value !== '' && !options.includes(value)
  const [showCustom, setShowCustom] = useState(isCustom)

  // If parent resets value to a preset, exit custom mode
  useEffect(() => {
    if (options.includes(value)) setShowCustom(false)
  }, [value, options])

  if (showCustom) {
    return (
      <div className="flex gap-1">
        <input
          type="text"
          autoFocus
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Type custom…"
          className={inputCls + ' flex-1'}
        />
        <button
          type="button"
          title="Choose from list"
          onClick={() => { setShowCustom(false); onChange(options[0]) }}
          className="px-2 border border-gray-300 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      </div>
    )
  }

  return (
    <select
      value={value}
      onChange={e => {
        if (e.target.value === '__custom__') {
          setShowCustom(true)
          onChange('')
        } else {
          onChange(e.target.value)
        }
      }}
      className={inputCls}
    >
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {options.map(o => <option key={o} value={o}>{o}</option>)}
      <option value="__custom__">Other…</option>
    </select>
  )
}
