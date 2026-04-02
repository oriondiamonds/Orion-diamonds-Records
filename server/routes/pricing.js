import { getGoldRate24k, getCachedAt } from '../utils/gold-rate.js'
import { calculateEnquiryPrice } from '../utils/pricing.js'

export function registerPricingRoutes(app) {
  // GET /api/gold-rate
  // Optional ?refresh=1 to force bypass cache (admin use)
  app.get('/api/gold-rate', async (_req, res) => {
    try {
      const forceRefresh = _req.query.refresh === '1'
      const rate = await getGoldRate24k(forceRefresh)
      res.json({ rate, unit: 'INR per gram (24K)', cachedAt: getCachedAt() })
    } catch (err) {
      console.error('Gold rate route error:', err)
      res.status(500).json({ error: 'Failed to fetch gold rate' })
    }
  })

  // POST /api/pricing/calculate
  // Body: { diamonds, metalWeight, metalType, karat, goldRateOverride? }
  app.post('/api/pricing/calculate', async (req, res) => {
    try {
      const { diamonds, metalWeight, metalType, karat, goldRateOverride, makingChargesOverride } = req.body

      const goldRate24k = goldRateOverride
        ? parseFloat(goldRateOverride)
        : await getGoldRate24k()

      const result = calculateEnquiryPrice({
        diamonds: diamonds ?? [],
        metalWeight: parseFloat(metalWeight) || 0,
        metalType: metalType || 'Gold',
        karat: karat || '18k',
        goldRate24k,
        makingChargesOverride: makingChargesOverride != null ? parseFloat(makingChargesOverride) : null,
      })

      res.json({ ...result, goldRate24k })
    } catch (err) {
      console.error('Pricing calc error:', err)
      res.status(500).json({ error: 'Pricing calculation failed' })
    }
  })
}
