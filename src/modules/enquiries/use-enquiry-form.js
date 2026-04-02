import { useState, useEffect, useRef, useCallback } from 'react'
import { getDiamondRatePerCt } from '../../utils/diamond-rates.js'

const newDiamond = () => ({
  id: crypto.randomUUID(),
  shape: 'Round',
  count: '',
  weightPerStone: '',
  pricePerCtOverride: '',
})

const INITIAL = {
  enquiryDate:    new Date().toISOString().split('T')[0],
  customerName:   '',
  customerContact:'',
  category:       'Ring',
  metalType:      'Gold',
  karat:          '18k',
  goldRate:        '',
  metalWeight:     '',
  makingCharges:   '',
  diamonds:        [newDiamond()],
  budget:          '',
  notes:           '',
  // derived
  pricing:        null,
  priceLoading:   false,
}

export function useEnquiryForm(initialValues = null) {
  const [form, setForm] = useState(() =>
    initialValues ? { ...INITIAL, ...flattenInitial(initialValues) } : INITIAL
  )
  const debounceRef = useRef(null)

  // ── Field setters ──────────────────────────────────────────────────────────
  const setField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  // ── Diamond row helpers ────────────────────────────────────────────────────
  const addDiamond = useCallback(() => {
    setForm(prev => ({ ...prev, diamonds: [...prev.diamonds, newDiamond()] }))
  }, [])

  const removeDiamond = useCallback((id) => {
    setForm(prev => ({
      ...prev,
      diamonds: prev.diamonds.length > 1
        ? prev.diamonds.filter(d => d.id !== id)
        : prev.diamonds,  // keep at least one row
    }))
  }, [])

  const updateDiamond = useCallback((id, field, value) => {
    setForm(prev => ({
      ...prev,
      diamonds: prev.diamonds.map(d => d.id === id ? { ...d, [field]: value } : d),
    }))
  }, [])

  // ── Rate auto-fill: on mount + whenever metalType changes ─────────────────
  useEffect(() => {
    if (form.metalType === 'Silver') {
      setForm(prev => ({ ...prev, goldRate: 100 }))
    } else {
      fetch('/api/gold-rate')
        .then(r => r.json())
        .then(({ rate }) => setForm(prev => ({ ...prev, goldRate: rate })))
        .catch(() => {})
    }
  }, [form.metalType]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced pricing fetch (600ms) ────────────────────────────────────────
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const { metalType, karat, metalWeight, diamonds, goldRate, makingCharges } = form
      const hasInput = parseFloat(metalWeight) > 0 ||
        diamonds.some(d => parseInt(d.count) > 0 && parseFloat(d.weightPerStone) > 0)
      if (!hasInput) return

      setForm(prev => ({ ...prev, priceLoading: true }))
      try {
        const res = await fetch('/api/pricing/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metalType,
            karat: metalType === 'Silver' ? 'silver' : karat,
            metalWeight:     parseFloat(metalWeight) || 0,
            goldRateOverride:    goldRate || undefined,
            makingChargesOverride: makingCharges ? parseFloat(makingCharges) : undefined,
            diamonds: diamonds
              .filter(d => parseInt(d.count) > 0 && parseFloat(d.weightPerStone) > 0)
              .map(d => ({
                shape: d.shape,
                count: parseInt(d.count),
                weightPerStone: parseFloat(d.weightPerStone),
                ...(d.pricePerCtOverride ? { pricePerCt: parseFloat(d.pricePerCtOverride) } : {}),
              })),
          }),
        })
        const pricing = await res.json()
        setForm(prev => ({ ...prev, pricing, priceLoading: false }))
      } catch {
        setForm(prev => ({ ...prev, priceLoading: false }))
      }
    }, 600)
    return () => clearTimeout(debounceRef.current)
  }, [form.metalType, form.karat, form.metalWeight, form.goldRate, form.makingCharges, form.diamonds])

  // ── Client-side per-row computed values ───────────────────────────────────
  function getDiamondRows() {
    return form.diamonds.map(d => {
      const w = parseFloat(d.weightPerStone) || 0
      const autoRate   = w > 0 ? getDiamondRatePerCt(d.shape, w) : 0
      const pricePerCt = parseFloat(d.pricePerCtOverride) || autoRate
      const lineTotal  = pricePerCt && d.count && w
        ? parseInt(d.count) * w * pricePerCt
        : 0
      return { ...d, pricePerCt, autoRate, lineTotal }
    })
  }

  return { form, setField, addDiamond, removeDiamond, updateDiamond, getDiamondRows }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function flattenInitial(enq) {
  return {
    enquiryDate:     enq.enquiry_date     ?? '',
    customerName:    enq.customer_name    ?? '',
    customerContact: enq.customer_contact ?? '',
    category:        enq.category         ?? 'Ring',
    metalType:       enq.metal_type       ?? 'Gold',
    karat:           enq.karat            ?? '18k',
    goldRate:      enq.gold_rate_at_time   ?? '',
    metalWeight:   enq.metal_weight_grams  ?? '',
    makingCharges: enq.making_charges      ?? '',
    diamonds: enq.enquiry_diamonds?.length
      ? enq.enquiry_diamonds.map(d => ({
          id:                 crypto.randomUUID(),
          shape:              d.shape,
          count:              String(d.count),
          weightPerStone:     String(d.weight_per_stone),
          pricePerCtOverride: d.price_per_ct ? String(d.price_per_ct) : '',
        }))
      : [newDiamond()],
    budget: enq.budget ?? '',
    notes:  enq.notes  ?? '',
    pricing: null,
    priceLoading: false,
  }
}
