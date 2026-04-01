import express from 'express'
import { registerAuthRoutes } from './routes/auth.js'
import { registerPricingRoutes } from './routes/pricing.js'
import { registerEnquiriesRoutes } from './routes/enquiries.js'

const app = express()
app.use(express.json())

registerAuthRoutes(app)
registerPricingRoutes(app)
registerEnquiriesRoutes(app)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Global error handler — must be 4-arg for Express to treat it as error middleware
// Without this, unhandled errors crash the Vercel serverless process instead of returning 500
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

export default app
