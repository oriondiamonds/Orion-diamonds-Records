import { Trash2 } from 'lucide-react'
import { formatINR } from '../utils/format-currency.js'
import ComboSelect from './ComboSelect.jsx'

const inputCls = 'w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'

export default function DiamondRow({ row, onChange, onRemove, showRemove }) {
  return (
    <div className="grid gap-2 items-center" style={{ gridTemplateColumns: '110px 56px 90px 80px 90px 32px' }}>
      {/* Shape */}
      <ComboSelect
        options={['Round', 'Non-round', 'Princess', 'Oval', 'Cushion', 'Emerald', 'Pear', 'Marquise', 'Radiant', 'Asscher']}
        value={row.shape}
        onChange={v => onChange('shape', v)}
      />

      {/* Count */}
      <input
        type="number" min="1" step="1"
        placeholder="Qty"
        value={row.count}
        onChange={e => onChange('count', e.target.value)}
        className={inputCls + ' text-center'}
      />

      {/* Weight per stone */}
      <input
        type="number" min="0" step="0.001"
        placeholder="Wt (ct)"
        value={row.weightPerStone}
        onChange={e => onChange('weightPerStone', e.target.value)}
        className={inputCls}
      />

      {/* Rate per ct — editable, auto-rate shown as placeholder */}
      <input
        type="number" min="0" step="1"
        value={row.pricePerCtOverride}
        onChange={e => onChange('pricePerCtOverride', e.target.value)}
        placeholder={row.autoRate ? String(row.autoRate) : '₹/ct'}
        className={inputCls + ' text-right'}
      />

      {/* Line total — read only */}
      <div className="text-sm font-medium text-gray-800 text-right pr-1">
        {row.lineTotal ? formatINR(row.lineTotal) : '—'}
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        disabled={!showRemove}
        className="flex items-center justify-center text-gray-400 hover:text-red-500 disabled:opacity-0 transition-colors"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
