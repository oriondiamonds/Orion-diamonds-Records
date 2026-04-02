import { createPortal } from 'react-dom'
import { formatINR } from '../../utils/format-currency.js'

export default function EnquiryPrintView({ enquiry }) {
  if (!enquiry) return null

  const diamonds = enquiry.enquiry_diamonds ?? []
  const hasDiamonds = diamonds.some(d => d.count > 0 && d.weight_per_stone > 0)
  const budgetNum = enquiry.budget ? parseFloat(enquiry.budget) : null
  const balance   = budgetNum != null ? enquiry.total_price - budgetNum : null

  const formattedDate = enquiry.enquiry_date
    ? new Date(enquiry.enquiry_date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—'

  return createPortal(
    <div className="print-view" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orion Diamonds</h1>
          <p className="text-xs text-gray-500 mt-0.5">Fine Jewellery</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tracking-widest uppercase text-gray-700">Quotation</p>
          <p className="text-xs text-gray-600 mt-1">
            <span className="font-medium">ENQ #</span>{' '}
            <span className="font-mono">{enquiry.enquiry_number}</span>
          </p>
          <p className="text-xs text-gray-600">
            <span className="font-medium">Date:</span> {formattedDate}
          </p>
        </div>
      </div>

      {/* ── Customer ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Customer</p>
        <p className="text-sm font-semibold">{enquiry.customer_name}</p>
        <p className="text-sm text-gray-600">{enquiry.customer_contact}</p>
      </div>

      {/* ── Item Details ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Item Details</p>
        <table className="w-full text-xs border border-gray-300">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-1.5 px-3 font-medium text-gray-600 w-40">Category</td>
              <td className="py-1.5 px-3">{enquiry.category || '—'}</td>
              <td className="py-1.5 px-3 font-medium text-gray-600 w-40">Metal</td>
              <td className="py-1.5 px-3">
                {enquiry.metal_type}
                {enquiry.metal_type !== 'Silver' && enquiry.karat ? ` · ${enquiry.karat.toUpperCase()}` : ''}
              </td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-1.5 px-3 font-medium text-gray-600">Weight</td>
              <td className="py-1.5 px-3">
                {enquiry.metal_weight_grams ? `${enquiry.metal_weight_grams}g` : '—'}
              </td>
              <td className="py-1.5 px-3 font-medium text-gray-600">Gold Rate Used</td>
              <td className="py-1.5 px-3">
                {enquiry.gold_rate_at_time
                  ? `₹${parseFloat(enquiry.gold_rate_at_time).toLocaleString('en-IN')}/g (24K)`
                  : '—'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Diamond Table ─────────────────────────────────────────────────── */}
      {hasDiamonds && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Diamonds</p>
          <table className="w-full text-xs border border-gray-300">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-300">
                <th className="py-1.5 px-3 text-left font-semibold">Shape</th>
                <th className="py-1.5 px-3 text-center font-semibold">Qty</th>
                <th className="py-1.5 px-3 text-right font-semibold">Wt/stone (ct)</th>
                <th className="py-1.5 px-3 text-right font-semibold">₹/ct</th>
                <th className="py-1.5 px-3 text-right font-semibold">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {diamonds.filter(d => d.count > 0 && d.weight_per_stone > 0).map((d, i) => (
                <tr key={i} className="border-b border-gray-200">
                  <td className="py-1.5 px-3">{d.shape}</td>
                  <td className="py-1.5 px-3 text-center">{d.count}</td>
                  <td className="py-1.5 px-3 text-right">{parseFloat(d.weight_per_stone).toFixed(3)}</td>
                  <td className="py-1.5 px-3 text-right">
                    {d.price_per_ct ? `₹${parseFloat(d.price_per_ct).toLocaleString('en-IN')}` : '—'}
                  </td>
                  <td className="py-1.5 px-3 text-right">
                    {d.line_total ? formatINR(d.line_total) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Price Breakdown ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Price Breakdown</p>
        <table className="w-full text-xs border border-gray-300">
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-1.5 px-3 text-gray-600">Diamond Total</td>
              <td className="py-1.5 px-3 text-right">{formatINR(enquiry.diamond_total)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-1.5 px-3 text-gray-600">Gold / Metal</td>
              <td className="py-1.5 px-3 text-right">{formatINR(enquiry.gold_total)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-1.5 px-3 text-gray-600">Making Charges</td>
              <td className="py-1.5 px-3 text-right">{formatINR(enquiry.making_charges)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-1.5 px-3 text-gray-600">Subtotal</td>
              <td className="py-1.5 px-3 text-right">{formatINR(enquiry.subtotal)}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="py-1.5 px-3 text-gray-600">GST 3%</td>
              <td className="py-1.5 px-3 text-right">{formatINR(enquiry.gst_amount)}</td>
            </tr>
            <tr className="bg-gray-100">
              <td className="py-2 px-3 font-bold text-gray-900">Total</td>
              <td className="py-2 px-3 text-right font-bold text-gray-900">{formatINR(enquiry.total_price)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Budget & Balance ──────────────────────────────────────────────── */}
      {budgetNum != null && (
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Budget</p>
          <table className="w-full text-xs border border-gray-300">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-1.5 px-3 text-gray-600">Customer Budget</td>
                <td className="py-1.5 px-3 text-right">{formatINR(budgetNum)}</td>
              </tr>
              {balance != null && (
                <tr>
                  <td className="py-1.5 px-3 font-medium text-gray-700">Balance</td>
                  <td className={`py-1.5 px-3 text-right font-semibold ${balance < 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {formatINR(balance)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="border-t border-gray-300 pt-4 mt-8 text-center">
        <p className="text-xs text-gray-400">This is a computer-generated quotation.</p>
      </div>
    </div>,
    document.body
  )
}
