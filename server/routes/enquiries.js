import multer from 'multer'
import supabase from '../supabase.js'
import { getGoldRate24k } from '../utils/gold-rate.js'
import { calculateEnquiryPrice } from '../utils/pricing.js'

const upload = multer({ storage: multer.memoryStorage() })

function generateEnquiryNumber(todayCount) {
  const d = new Date()
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `ENQ-${date}-${String(todayCount + 1).padStart(4, '0')}`
}

export function registerEnquiriesRoutes(app) {

  // ── GET /api/enquiries ─────────────────────────────────────────────────────
  app.get('/api/enquiries', async (req, res) => {
    try {
      const page   = Math.max(1, parseInt(req.query.page)  || 1)
      const limit  = Math.min(100, parseInt(req.query.limit) || 25)
      const offset = (page - 1) * limit
      const status = req.query.status?.trim() || ''
      const search = req.query.search?.trim() || ''

      const ascending = req.query.sortDir === 'asc'

      let query = supabase
        .from('enquiries')
        .select(
          'id, enquiry_number, enquiry_date, customer_name, customer_contact, category, metal_type, karat, gold_rate_market_24k, gold_rate_at_time, metal_weight_grams, diamond_total, gold_total, making_charges, total_price, budget, status, created_at, enquiry_diamonds(shape, count, weight_per_stone)',
          { count: 'exact' }
        )
        .order('enquiry_date', { ascending })
        .order('created_at', { ascending })
        .range(offset, offset + limit - 1)

      const dateFrom = req.query.dateFrom?.trim() || ''
      const dateTo   = req.query.dateTo?.trim()   || ''

      if (status)   query = query.eq('status', status)
      if (dateFrom) query = query.gte('enquiry_date', dateFrom)
      if (dateTo)   query = query.lte('enquiry_date', dateTo)
      if (search) query = query.or(
        `customer_name.ilike.%${search}%,customer_contact.ilike.%${search}%,enquiry_number.ilike.%${search}%`
      )

      const { data, count, error } = await query
      if (error) throw error

      res.json({ enquiries: data, total: count, page, limit })
    } catch (err) {
      console.error('List enquiries error:', err)
      res.status(500).json({ error: 'Failed to fetch enquiries' })
    }
  })

  // ── POST /api/enquiries ────────────────────────────────────────────────────
  app.post('/api/enquiries', async (req, res) => {
    try {
      const {
        customerName, customerContact, enquiryDate,
        category, metalType, karat,
        metalWeight, goldRateOverride, makingChargesOverride,
        diamonds, budget, notes, createdBy,
      } = req.body

      if (!customerName?.trim() || !customerContact?.trim()) {
        return res.status(400).json({ error: 'Customer name and contact are required' })
      }

      // Enquiry number: count today's enquiries first
      const today = new Date().toISOString().split('T')[0]
      const { count: todayCount } = await supabase
        .from('enquiries')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00.000Z`)

      const enquiryNumber = generateEnquiryNumber(todayCount ?? 0)

      // Pricing — always fetch live market rate, apply user override separately
      const marketRate24k = await getGoldRate24k()
      const goldRate24k   = goldRateOverride ? parseFloat(goldRateOverride) : marketRate24k

      const pricing = calculateEnquiryPrice({
        diamonds:    diamonds ?? [],
        metalWeight: parseFloat(metalWeight) || 0,
        metalType:   metalType || 'Gold',
        karat:       karat || '18k',
        goldRate24k,
        makingChargesOverride: makingChargesOverride != null ? parseFloat(makingChargesOverride) : null,
      })

      const budgetNum = budget ? parseFloat(budget) : null

      // Insert enquiry row
      const { data: enquiry, error: enqErr } = await supabase
        .from('enquiries')
        .insert({
          enquiry_number:      enquiryNumber,
          customer_name:       customerName.trim(),
          customer_contact:    customerContact.trim(),
          enquiry_date:        enquiryDate,
          category,
          metal_type:          metalType || 'Gold',
          karat:               karat || '18k',
          gold_rate_market_24k: marketRate24k,
          gold_rate_at_time:    goldRate24k,
          metal_weight_grams:  parseFloat(metalWeight) || null,
          diamond_total:       pricing.diamondTotal,
          gold_total:          pricing.goldTotal,
          making_charges:      pricing.makingCharges,
          subtotal:            pricing.subtotal,
          gst_amount:          pricing.gstAmount,
          total_price:         pricing.totalPrice,
          budget:              budgetNum,
          balance:             budgetNum != null ? pricing.totalPrice - budgetNum : null,
          notes:               notes?.trim() || null,
          created_by:          createdBy || null,
          status:              'Pending',
        })
        .select()
        .single()

      if (enqErr) throw enqErr

      // Insert diamond rows
      const validDiamonds = (diamonds ?? []).filter(
        d => parseInt(d.count) > 0 && parseFloat(d.weightPerStone) > 0
      )
      if (validDiamonds.length) {
        const rows = validDiamonds.map((d, i) => ({
          enquiry_id:       enquiry.id,
          sort_order:       i,
          shape:            d.shape || 'Round',
          count:            parseInt(d.count),
          weight_per_stone: parseFloat(d.weightPerStone),
          price_per_ct:     d.pricePerCt     ? parseFloat(d.pricePerCt)  : null,
          line_total:       d.lineTotal      ? parseFloat(d.lineTotal)   : null,
        }))
        const { error: dErr } = await supabase.from('enquiry_diamonds').insert(rows)
        if (dErr) console.error('Diamond insert error:', dErr.message)
      }

      res.status(201).json({ enquiry })
    } catch (err) {
      console.error('Create enquiry error:', err)
      res.status(500).json({ error: 'Failed to create enquiry' })
    }
  })

  // ── GET /api/enquiries/:id ─────────────────────────────────────────────────
  app.get('/api/enquiries/:id', async (req, res) => {
    try {
      const { data: enquiry, error } = await supabase
        .from('enquiries')
        .select('*, enquiry_diamonds(*)')
        .eq('id', req.params.id)
        .order('sort_order', { referencedTable: 'enquiry_diamonds', ascending: true })
        .single()

      if (error || !enquiry) return res.status(404).json({ error: 'Enquiry not found' })
      res.json({ enquiry })
    } catch (err) {
      console.error('Get enquiry error:', err)
      res.status(500).json({ error: 'Failed to fetch enquiry' })
    }
  })

  // ── PUT /api/enquiries/:id ────────────────────────────────────────────────
  app.put('/api/enquiries/:id', async (req, res) => {
    try {
      const {
        customerName, customerContact, enquiryDate,
        category, metalType, karat,
        metalWeight, goldRateOverride, makingChargesOverride,
        diamonds, budget, notes,
      } = req.body

      if (!customerName?.trim() || !customerContact?.trim()) {
        return res.status(400).json({ error: 'Customer name and contact are required' })
      }

      // Fetch existing row to preserve gold_rate_market_24k and gold_rate_at_time
      const { data: existing, error: fetchErr } = await supabase
        .from('enquiries')
        .select('gold_rate_market_24k, gold_rate_at_time')
        .eq('id', req.params.id)
        .single()

      if (fetchErr || !existing) return res.status(404).json({ error: 'Enquiry not found' })

      // Use override if provided, else keep the stored rate
      const goldRate24k = goldRateOverride
        ? parseFloat(goldRateOverride)
        : existing.gold_rate_at_time

      const pricing = calculateEnquiryPrice({
        diamonds:    diamonds ?? [],
        metalWeight: parseFloat(metalWeight) || 0,
        metalType:   metalType || 'Gold',
        karat:       karat || '18k',
        goldRate24k,
        makingChargesOverride: makingChargesOverride != null ? parseFloat(makingChargesOverride) : null,
      })

      const budgetNum = budget ? parseFloat(budget) : null

      // Update enquiry row
      const { data: updatedRow, error: updateErr } = await supabase
        .from('enquiries')
        .update({
          customer_name:       customerName.trim(),
          customer_contact:    customerContact.trim(),
          enquiry_date:        enquiryDate,
          category,
          metal_type:          metalType || 'Gold',
          karat:               karat || '18k',
          gold_rate_at_time:   goldRate24k,
          metal_weight_grams:  parseFloat(metalWeight) || null,
          diamond_total:       pricing.diamondTotal,
          gold_total:          pricing.goldTotal,
          making_charges:      pricing.makingCharges,
          subtotal:            pricing.subtotal,
          gst_amount:          pricing.gstAmount,
          total_price:         pricing.totalPrice,
          budget:              budgetNum,
          balance:             budgetNum != null ? pricing.totalPrice - budgetNum : null,
          notes:               notes?.trim() || null,
          updated_at:          new Date().toISOString(),
        })
        .eq('id', req.params.id)
        .select()
        .single()

      if (updateErr) throw updateErr

      // Replace diamond rows
      await supabase.from('enquiry_diamonds').delete().eq('enquiry_id', req.params.id)

      const validDiamonds = (diamonds ?? []).filter(
        d => parseInt(d.count) > 0 && parseFloat(d.weightPerStone) > 0
      )
      if (validDiamonds.length) {
        const rows = validDiamonds.map((d, i) => ({
          enquiry_id:       req.params.id,
          sort_order:       i,
          shape:            d.shape || 'Round',
          count:            parseInt(d.count),
          weight_per_stone: parseFloat(d.weightPerStone),
          price_per_ct:     d.pricePerCt ? parseFloat(d.pricePerCt) : null,
          line_total:       d.lineTotal  ? parseFloat(d.lineTotal)  : null,
        }))
        const { error: dErr } = await supabase.from('enquiry_diamonds').insert(rows)
        if (dErr) console.error('Diamond insert error:', dErr.message)
      }

      res.json({ enquiry: updatedRow })
    } catch (err) {
      console.error('Update enquiry error:', err)
      res.status(500).json({ error: 'Failed to update enquiry' })
    }
  })

  // ── PATCH /api/enquiries/:id/status ───────────────────────────────────────
  app.patch('/api/enquiries/:id/status', async (req, res) => {
    try {
      const { status } = req.body
      const VALID_STATUSES = ['Pending', 'Quoted', 'Converted', 'Closed']

      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` })
      }

      const { data, error } = await supabase
        .from('enquiries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', req.params.id)
        .select('id, status')
        .single()

      if (error) throw error
      res.json({ enquiry: data })
    } catch (err) {
      console.error('Update status error:', err)
      res.status(500).json({ error: 'Failed to update status' })
    }
  })

  // ── POST /api/enquiries/:id/image ──────────────────────────────────────────
  app.post('/api/enquiries/:id/image', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file provided' })

      const ext  = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase()
      const path = `${req.params.id}/reference.${ext}`

      const { error: uploadErr } = await supabase.storage
        .from('enquiry-images')
        .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true })

      if (uploadErr) throw uploadErr

      const { data: { publicUrl } } = supabase.storage
        .from('enquiry-images')
        .getPublicUrl(path)

      await supabase
        .from('enquiries')
        .update({ reference_image_url: publicUrl })
        .eq('id', req.params.id)

      res.json({ url: publicUrl })
    } catch (err) {
      console.error('Image upload error:', err)
      res.status(500).json({ error: 'Image upload failed' })
    }
  })
}
