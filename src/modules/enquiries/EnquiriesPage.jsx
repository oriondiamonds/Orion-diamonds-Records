import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { listEnquiries } from './enquiry.service.js'
import StatusBadge from '../../components/StatusBadge.jsx'
import { formatINR } from '../../utils/format-currency.js'

const STATUSES = ['', 'Pending', 'Quoted', 'Converted', 'Closed']

export default function EnquiriesPage() {
  const [data, setData]     = useState({ enquiries: [], total: 0 })
  const [page, setPage]     = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [sortDir, setSortDir]   = useState('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo]     = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const fetchEnquiries = useCallback(async () => {
    try {
      const result = await listEnquiries({ page, status, search, sortDir, dateFrom, dateTo })
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, status, search, sortDir, dateFrom, dateTo])

  // Initial fetch + 30s auto-refresh
  useEffect(() => {
    setLoading(true)
    fetchEnquiries()
    const id = setInterval(fetchEnquiries, 30_000)
    return () => clearInterval(id)
  }, [fetchEnquiries])

  const totalPages = Math.ceil(data.total / 25)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Enquiries</h1>
          {data.total > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">{data.total} total</p>
          )}
        </div>
        <button
          onClick={() => navigate('/enquiries/new')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus size={15} /> New Enquiry
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Name, contact, ENQ#…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-60"
          />
        </div>
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s || 'All Statuses'}</option>
          ))}
        </select>

        <input
          type="date"
          value={dateFrom}
          onChange={e => { setDateFrom(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="From date"
        />
        <span className="self-center text-gray-400 text-sm">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={e => { setDateTo(e.target.value); setPage(1) }}
          className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          title="To date"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1) }}
            className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
        <button
          onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setPage(1) }}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Date {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                'ENQ #', 'Date', 'Customer', 'Contact', 'Category',
                'Metal', 'Wt (g)',
                'Rate 24K', 'Applied Rate', 'Karat Rate',
                'Diamonds', 'Diamond Total', 'Gold Total', 'Making', 'Total', 'Budget', 'Balance', 'Status'
              ].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 18 }).map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-4 bg-gray-100 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.enquiries.length === 0 ? (
              <tr>
                <td colSpan={18} className="px-4 py-12 text-center text-gray-400">
                  No enquiries found
                </td>
              </tr>
            ) : (
              data.enquiries.map(enq => {
                const marketRate  = enq.gold_rate_market_24k ? Number(enq.gold_rate_market_24k) : null
                const appliedRate = enq.gold_rate_at_time   ? Number(enq.gold_rate_at_time)    : null
                const karatNum   = enq.karat ? parseInt(enq.karat) : null
                const karatRate  = appliedRate && karatNum ? Math.round(appliedRate * karatNum / 24) : null
                const fmt = n => n ? `₹${n.toLocaleString('en-IN')}` : '—'
                const diamondSummary = (enq.enquiry_diamonds ?? [])
                  .filter(d => d.count > 0 && d.weight_per_stone > 0)
                  .map(d => `${d.shape} ${d.weight_per_stone}ct×${d.count}`)
                  .join(', ') || '—'

                return (
                  <tr
                    key={enq.id}
                    onClick={() => navigate(`/enquiries/${enq.id}`)}
                    className="cursor-pointer hover:bg-indigo-50 transition-colors"
                  >
                    <td className="px-3 py-3 font-mono text-xs text-indigo-600 font-medium whitespace-nowrap">
                      {enq.enquiry_number}
                    </td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">{enq.enquiry_date}</td>
                    <td className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap">{enq.customer_name}</td>
                    <td className="px-3 py-3 text-gray-500">{enq.customer_contact}</td>
                    <td className="px-3 py-3 text-gray-700">{enq.category}</td>
                    <td className="px-3 py-3 text-gray-500 whitespace-nowrap">
                      {enq.metal_type} {enq.karat !== 'silver' ? enq.karat?.toUpperCase() : ''}
                    </td>
                    <td className="px-3 py-3 text-gray-500 text-right">{enq.metal_weight_grams ?? '—'}</td>

                    {/* Rate 24K — live market rate at time of creation */}
                    <td className="px-3 py-3 text-gray-500 text-right whitespace-nowrap">{fmt(marketRate)}</td>
                    {/* Applied Rate — what was actually used (user override or market) */}
                    <td className={`px-3 py-3 text-right whitespace-nowrap font-medium ${appliedRate !== marketRate ? 'text-amber-600' : 'text-gray-700'}`}>
                      {fmt(appliedRate)}
                    </td>
                    {/* Karat Rate — rate24k × karat/24 */}
                    <td className="px-3 py-3 text-indigo-600 text-right whitespace-nowrap">{fmt(karatRate)}</td>

                    {/* Diamonds: shape weight×count per row, comma separated */}
                    <td className="px-3 py-3 text-gray-600 text-xs max-w-[180px]">
                      <span className="block truncate" title={diamondSummary}>{diamondSummary}</span>
                    </td>
                    <td className="px-3 py-3 text-gray-700 text-right">{enq.diamond_total ? formatINR(enq.diamond_total) : '—'}</td>
                    <td className="px-3 py-3 text-gray-700 text-right">{enq.gold_total ? formatINR(enq.gold_total) : '—'}</td>
                    <td className="px-3 py-3 text-gray-700 text-right">{enq.making_charges ? formatINR(enq.making_charges) : '—'}</td>
                    <td className="px-3 py-3 font-semibold text-gray-900 text-right whitespace-nowrap">{enq.total_price ? formatINR(enq.total_price) : '—'}</td>
                    <td className="px-3 py-3 text-gray-500 text-right">{enq.budget ? formatINR(enq.budget) : '—'}</td>
                    <td className={`px-3 py-3 text-right font-medium whitespace-nowrap ${
                      enq.total_price && enq.budget
                        ? (enq.total_price - enq.budget) > 0 ? 'text-red-600' : 'text-green-600'
                        : 'text-gray-400'
                    }`}>
                      {enq.total_price && enq.budget ? fmt(Math.abs(enq.total_price - enq.budget)) : '—'}
                    </td>
                    <td className="px-3 py-3"><StatusBadge status={enq.status} /></td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
