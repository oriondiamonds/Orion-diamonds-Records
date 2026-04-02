import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Printer, Edit2 } from 'lucide-react'
import { getEnquiry, updateEnquiry, updateStatus } from './enquiry.service.js'
import EnquiryForm from './EnquiryForm.jsx'
import PriceSummary from '../../components/PriceSummary.jsx'
import StatusBadge from '../../components/StatusBadge.jsx'
import ConfirmDialog from '../../components/ConfirmDialog.jsx'
import EnquiryPrintView from './EnquiryPrintView.jsx'
import { formatINR } from '../../utils/format-currency.js'

const VALID_STATUSES = ['Pending', 'Quoted', 'Converted', 'Closed']

export default function EnquiryDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [enquiry, setEnquiry]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [editMode, setEditMode]           = useState(false)
  const [statusSaving, setStatusSaving]   = useState(false)
  const [confirmStatus, setConfirmStatus] = useState({ open: false, next: '' })
  const [error, setError]                 = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const data = await getEnquiry(id)
        setEnquiry(data.enquiry)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  async function handleSaved(payload) {
    if (!payload) {
      // Cancel — exit edit mode
      setEditMode(false)
      return
    }
    try {
      const apiPayload = {
        customerName:          payload.customerName,
        customerContact:       payload.customerContact,
        enquiryDate:           payload.enquiryDate,
        category:              payload.category,
        metalType:             payload.metalType,
        karat:                 payload.karat,
        metalWeight:           payload.metalWeight,
        goldRateOverride:      payload.goldRateOverride,
        makingChargesOverride: payload.makingChargesOverride,
        diamonds:              payload.diamonds,
        budget:                payload.budget,
        notes:                 payload.notes,
      }
      await updateEnquiry(id, apiPayload)
      const data = await getEnquiry(id)
      setEnquiry(data.enquiry)
      setEditMode(false)
    } catch (err) {
      setError(err.message)
    }
  }

  function handleStatusSelectChange(e) {
    setConfirmStatus({ open: true, next: e.target.value })
  }

  async function handleStatusConfirm() {
    const next = confirmStatus.next
    setConfirmStatus({ open: false, next: '' })
    setStatusSaving(true)
    try {
      await updateStatus(id, next)
      setEnquiry(prev => ({ ...prev, status: next }))
    } catch (err) {
      setError(err.message)
    } finally {
      setStatusSaving(false)
    }
  }

  function handleStatusCancel() {
    setConfirmStatus({ open: false, next: '' })
  }

  const pricing = enquiry ? {
    diamondTotal:      enquiry.diamond_total,
    goldTotal:         enquiry.gold_total,
    makingCharges:     enquiry.making_charges,
    subtotal:          enquiry.subtotal,
    gstAmount:         enquiry.gst_amount,
    totalPrice:        enquiry.total_price,
    autoMakingCharges: enquiry.making_charges,
  } : null

  const formattedDate = enquiry?.enquiry_date
    ? new Date(enquiry.enquiry_date).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '—'

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-5xl space-y-4 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 rounded" />
        <div className="h-4 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-200 rounded" />
      </div>
    )
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error && !enquiry) {
    return (
      <div className="max-w-5xl">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-md">{error}</p>
      </div>
    )
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  if (editMode) {
    return (
      <div className="max-w-5xl">
        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md">{error}</p>
        )}
        <EnquiryForm initialValues={enquiry} onSaved={handleSaved} />
      </div>
    )
  }

  // ── Read mode ─────────────────────────────────────────────────────────────
  const diamonds = enquiry?.enquiry_diamonds ?? []
  const hasDiamonds = diamonds.some(d => d.count > 0 && d.weight_per_stone > 0)
  const budgetNum = enquiry?.budget ? parseFloat(enquiry.budget) : null
  const balance   = budgetNum != null ? enquiry.total_price - budgetNum : null

  return (
    <div className="max-w-5xl">

      {/* ── Print view (hidden on screen, shown only when printing) ──────── */}
      <EnquiryPrintView enquiry={enquiry} />

      {/* ── Screen-only content ───────────────────────────────────────────── */}
      <div className="print:hidden">

      {/* ── Top bar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex items-center gap-3">
          {/* Status select */}
          <select
            value={enquiry?.status ?? 'Pending'}
            onChange={handleStatusSelectChange}
            disabled={statusSaving}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 bg-white"
          >
            {VALID_STATUSES.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Print button */}
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-gray-600"
          >
            <Printer size={15} /> Print
          </button>

          {/* Edit button */}
          <button
            type="button"
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            <Edit2 size={15} /> Edit
          </button>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md">{error}</p>
      )}

      {/* ── Header card ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-mono text-indigo-600 text-sm font-semibold tracking-wide">
              {enquiry?.enquiry_number}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{formattedDate}</p>
          </div>
          <StatusBadge status={enquiry?.status} />
        </div>
        <div className="mt-3 border-t border-gray-100 pt-3">
          <p className="text-base font-semibold text-gray-900">{enquiry?.customer_name}</p>
          <p className="text-sm text-gray-500">{enquiry?.customer_contact}</p>
        </div>
      </div>

      {/* ── Two-column grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* ── Left column ─────────────────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* Product card */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Product</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <dt className="text-xs text-gray-500">Category</dt>
                <dd className="text-gray-900 font-medium">{enquiry?.category || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Metal</dt>
                <dd className="text-gray-900 font-medium">
                  {enquiry?.metal_type}
                  {enquiry?.metal_type !== 'Silver' && enquiry?.karat
                    ? ` · ${enquiry.karat.toUpperCase()}`
                    : ''}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Weight</dt>
                <dd className="text-gray-900 font-medium">
                  {enquiry?.metal_weight_grams ? `${enquiry.metal_weight_grams}g` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-500">Gold Rate Used</dt>
                <dd className="text-gray-900 font-medium">
                  {enquiry?.gold_rate_at_time
                    ? `₹${parseFloat(enquiry.gold_rate_at_time).toLocaleString('en-IN')}/g (24K)`
                    : '—'}
                </dd>
              </div>
              {enquiry?.notes && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-500">Notes</dt>
                  <dd className="text-gray-700">{enquiry.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Diamonds table */}
          {hasDiamonds && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Diamonds</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-2 text-left text-xs font-medium text-gray-500">Shape</th>
                    <th className="pb-2 text-center text-xs font-medium text-gray-500">Qty</th>
                    <th className="pb-2 text-right text-xs font-medium text-gray-500">Wt/stone (ct)</th>
                    <th className="pb-2 text-right text-xs font-medium text-gray-500">₹/ct</th>
                    <th className="pb-2 text-right text-xs font-medium text-gray-500">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {diamonds.filter(d => d.count > 0 && d.weight_per_stone > 0).map((d, i) => (
                    <tr key={i}>
                      <td className="py-1.5 text-gray-800">{d.shape}</td>
                      <td className="py-1.5 text-center text-gray-800">{d.count}</td>
                      <td className="py-1.5 text-right text-gray-800">
                        {parseFloat(d.weight_per_stone).toFixed(3)}
                      </td>
                      <td className="py-1.5 text-right text-gray-800">
                        {d.price_per_ct
                          ? `₹${parseFloat(d.price_per_ct).toLocaleString('en-IN')}`
                          : '—'}
                      </td>
                      <td className="py-1.5 text-right text-gray-800">
                        {d.line_total ? formatINR(d.line_total) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Reference image */}
          {enquiry?.reference_image_url && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Reference Image</h2>
              <img
                src={enquiry.reference_image_url}
                alt="Reference"
                className="max-h-64 rounded-md object-contain border border-gray-100"
              />
            </div>
          )}
        </div>

        {/* ── Right column ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <PriceSummary
            pricing={pricing}
            budget={enquiry?.budget}
            loading={false}
            goldRate={enquiry?.gold_rate_at_time}
            karat={enquiry?.karat}
            metalType={enquiry?.metal_type}
            metalWeight={enquiry?.metal_weight_grams}
          />

          {budgetNum != null && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Budget</h3>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Customer Budget</span>
                  <span className="text-gray-800">{formatINR(budgetNum)}</span>
                </div>
                {balance != null && (
                  <div className={`flex justify-between font-semibold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span>Balance</span>
                    <span>{formatINR(balance)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      </div>{/* end print:hidden */}

      {/* ── Confirm dialog for status change ──────────────────────────────── */}
      <ConfirmDialog
        open={confirmStatus.open}
        title="Change Status"
        message={`Change status to "${confirmStatus.next}"?`}
        confirmLabel="Change"
        onConfirm={handleStatusConfirm}
        onCancel={handleStatusCancel}
      />
    </div>
  )
}
