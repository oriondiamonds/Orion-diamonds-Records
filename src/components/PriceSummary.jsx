import { formatINR } from '../utils/format-currency.js'

export default function PriceSummary({ pricing, budget, loading, goldRate, karat, metalType, metalWeight }) {
  if (!pricing && !loading) return null

  const budgetNum = budget ? parseFloat(budget) : null
  const balance   = pricing && budgetNum != null ? pricing.totalPrice - budgetNum : null

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Price Summary</h3>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-1.5 text-sm">
          {/* Diamond */}
          <Row label="Diamond" value={pricing.diamondTotal} />

          {/* Gold / Metal with rate+weight context */}
          <div>
            <Row label="Gold / Metal" value={pricing.goldTotal} />
            {goldRate && metalWeight && (
              <p className="text-xs text-gray-400 text-right mt-0.5">
                {metalType === 'Silver'
                  ? `${metalWeight}g @ ₹${parseFloat(goldRate).toLocaleString('en-IN')}/g`
                  : `${karat?.toUpperCase()} · ${metalWeight}g @ ₹${parseFloat(goldRate).toLocaleString('en-IN')}/g (24K)`
                }
              </p>
            )}
          </div>

          {/* Making charges with auto vs override indicator */}
          <div>
            <Row label="Making Charges" value={pricing.makingCharges} />
            {pricing.autoMakingCharges != null && pricing.makingCharges !== pricing.autoMakingCharges && (
              <p className="text-xs text-gray-400 text-right mt-0.5">
                auto: {formatINR(pricing.autoMakingCharges)}
              </p>
            )}
          </div>

          <Row label="Subtotal" value={pricing.subtotal} />
          <Row label="GST (3%)"  value={pricing.gstAmount} />

          <div className="border-t border-gray-200 pt-1.5 mt-1.5">
            <Row label="Total" value={pricing.totalPrice} bold />
          </div>

          {budgetNum != null && (
            <div className="border-t border-gray-200 pt-1.5 mt-1.5 space-y-1.5">
              <Row label="Budget" value={budgetNum} color="text-gray-500" />
              {balance != null && (
                <Row
                  label="Balance"
                  value={balance}
                  bold
                  color={balance < 0 ? 'text-red-600' : 'text-green-600'}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold, color }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold text-gray-900' : 'text-gray-600'} ${color ?? ''}`}>
      <span>{label}</span>
      <span className={bold ? '' : 'text-gray-800'}>{formatINR(value)}</span>
    </div>
  )
}
