import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, RefreshCw } from 'lucide-react'
import { useEnquiryForm } from './use-enquiry-form.js'
import { createEnquiry, uploadEnquiryImage } from './enquiry.service.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import DiamondRow from '../../components/DiamondRow.jsx'
import ComboSelect from '../../components/ComboSelect.jsx'
import PriceSummary from '../../components/PriceSummary.jsx'
import ImageUpload from '../../components/ImageUpload.jsx'

const CATEGORIES = ['Ring', 'Casting', 'Bracelet', 'Necklace', 'Pendant', 'NoseRing', 'Others']
const KARATS     = ['10k', '14k', '18k', '22k']

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
const labelCls = 'block text-xs font-medium text-gray-600 mb-1'

export default function EnquiryForm({ initialValues, onSaved }) {
  const { form, setField, addDiamond, removeDiamond, updateDiamond, getDiamondRows } = useEnquiryForm(initialValues)
  const [imageBlob, setImageBlob] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()
  const navigate = useNavigate()
  const diamondRows = getDiamondRows()
  const isEdit = !!initialValues

  async function refreshGoldRate() {
    try {
      const res = await fetch('/api/gold-rate?refresh=1')
      const { rate } = await res.json()
      setField('goldRate', rate)
    } catch { /* ignore */ }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        customerName:    form.customerName,
        customerContact: form.customerContact,
        enquiryDate:     form.enquiryDate,
        category:        form.category,
        metalType:       form.metalType,
        karat:           form.metalType === 'Silver' ? 'silver' : form.karat,
        metalWeight:     form.metalWeight,
        goldRateOverride:      form.goldRate,
        makingChargesOverride: form.makingCharges ? parseFloat(form.makingCharges) : undefined,
        diamonds: diamondRows
          .filter(d => parseInt(d.count) > 0 && parseFloat(d.weightPerStone) > 0)
          .map(d => ({
            shape:          d.shape,
            count:          d.count,
            weightPerStone: d.weightPerStone,
            lineTotal:      d.lineTotal,
            ...(d.pricePerCtOverride ? { pricePerCt: parseFloat(d.pricePerCtOverride) } : {}),
          })),
        budget:    form.budget,
        notes:     form.notes,
        createdBy: user?.id,
      }

      let enquiry
      if (isEdit) {
        // edit path handled by parent via onSaved
        onSaved?.({ ...initialValues, ...payload })
        return
      } else {
        const res = await createEnquiry(payload)
        enquiry = res.enquiry
      }

      if (imageBlob) {
        try { await uploadEnquiryImage(enquiry.id, imageBlob) } catch { /* non-fatal */ }
      }

      navigate(`/enquiries/${enquiry.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {!isEdit && (
          <button type="button" onClick={() => navigate('/')}
            className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <h1 className="text-lg font-semibold text-gray-900">
          {isEdit ? 'Edit Enquiry' : 'New Enquiry'}
        </h1>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">

          {/* ── Left column (form sections) ──────────────────────────────── */}
          <div className="col-span-2 space-y-4">

            {/* Section: Customer */}
            <Section title="Customer Info">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Date">
                  <input type="date" value={form.enquiryDate}
                    onChange={e => setField('enquiryDate', e.target.value)}
                    className={inputCls} required />
                </Field>
                <Field label="Name">
                  <input type="text" value={form.customerName}
                    onChange={e => setField('customerName', e.target.value)}
                    placeholder="Customer name"
                    className={inputCls} required />
                </Field>
                <Field label="Contact">
                  <input type="text" value={form.customerContact}
                    onChange={e => setField('customerContact', e.target.value)}
                    placeholder="Phone / Email"
                    className={inputCls} required />
                </Field>
              </div>
            </Section>

            {/* Section: Product */}
            <Section title="Product">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <ComboSelect
                    options={CATEGORIES}
                    value={form.category}
                    onChange={v => setField('category', v)}
                  />
                </Field>
                <Field label="Reference Image">
                  <ImageUpload onBlob={setImageBlob} />
                </Field>
              </div>
            </Section>

            {/* Section: Metal */}
            <Section title="Metal">
              <div className="grid grid-cols-4 gap-3">
                <Field label="Type">
                  <select value={form.metalType}
                    onChange={e => setField('metalType', e.target.value)}
                    className={inputCls}>
                    <option>Gold</option>
                    <option>Silver</option>
                  </select>
                </Field>

                {form.metalType === 'Gold' && (
                  <Field label="Karat">
                    <select value={form.karat}
                      onChange={e => setField('karat', e.target.value)}
                      className={inputCls}>
                      {KARATS.map(k => <option key={k}>{k}</option>)}
                    </select>
                  </Field>
                )}

                <Field label={
                  <span className="flex items-center gap-1">
                    {form.metalType === 'Silver' ? 'Silver Rate (₹/g)' : 'Gold Rate (₹/g 24K)'}
                    {form.metalType === 'Gold' && (
                      <button type="button" onClick={refreshGoldRate}
                        title="Refresh live rate"
                        className="text-indigo-500 hover:text-indigo-700 transition-colors">
                        <RefreshCw size={11} />
                      </button>
                    )}
                  </span>
                }>
                  <input type="number" value={form.goldRate}
                    onChange={e => setField('goldRate', e.target.value)}
                    placeholder={form.metalType === 'Silver' ? '100' : 'Live rate'}
                    className={inputCls} />
                </Field>

                <Field label="Weight (grams)">
                  <input type="number" step="0.001" min="0"
                    value={form.metalWeight}
                    onChange={e => setField('metalWeight', e.target.value)}
                    placeholder="0.000"
                    className={inputCls} />
                </Field>
              </div>
            </Section>

            {/* Section: Diamonds */}
            <Section title="Diamonds">
              {/* Column headers */}
              <div className="grid gap-2 mb-1 text-xs font-medium text-gray-500 px-0"
                style={{ gridTemplateColumns: '110px 56px 90px 80px 90px 32px' }}>
                <span>Shape</span>
                <span className="text-center">Qty</span>
                <span>Wt/stone (ct)</span>
                <span className="text-right pr-1">₹/ct</span>
                <span className="text-right pr-1">Line Total</span>
                <span />
              </div>

              <div className="space-y-2">
                {diamondRows.map(row => (
                  <DiamondRow
                    key={row.id}
                    row={row}
                    showRemove={form.diamonds.length > 1}
                    onChange={(field, val) => updateDiamond(row.id, field, val)}
                    onRemove={() => removeDiamond(row.id)}
                  />
                ))}
              </div>

              <button type="button" onClick={addDiamond}
                className="mt-3 flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
                <Plus size={14} /> Add row
              </button>
            </Section>

            {/* Section: Budget & Notes */}
            <Section title="Budget & Notes">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Making Charges (₹)">
                  <input type="number" min="0"
                    value={form.makingCharges}
                    onChange={e => setField('makingCharges', e.target.value)}
                    placeholder={form.pricing?.autoMakingCharges
                      ? String(form.pricing.autoMakingCharges)
                      : 'Auto'}
                    className={inputCls} />
                </Field>
                <Field label="Customer Budget (₹)">
                  <input type="number" value={form.budget}
                    onChange={e => setField('budget', e.target.value)}
                    placeholder="Optional"
                    className={inputCls} />
                </Field>
                <Field label="Notes">
                  <textarea value={form.notes}
                    onChange={e => setField('notes', e.target.value)}
                    rows={1}
                    placeholder="Any remarks…"
                    className={inputCls + ' resize-none'} />
                </Field>
              </div>
            </Section>
          </div>

          {/* ── Right column (price summary) ─────────────────────────────── */}
          <div className="space-y-4">
            <PriceSummary
              pricing={form.pricing}
              budget={form.budget}
              loading={form.priceLoading}
              goldRate={form.goldRate}
              karat={form.karat}
              metalType={form.metalType}
              metalWeight={form.metalWeight}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Save Enquiry'}
          </button>
          <button type="button"
            onClick={() => isEdit ? onSaved?.(null) : navigate('/')}
            className="px-5 py-2 border border-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-3">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {children}
    </label>
  )
}
