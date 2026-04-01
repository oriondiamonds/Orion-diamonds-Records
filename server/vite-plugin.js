import express from 'express'
import { registerAuthRoutes } from './routes/auth.js'
import { registerPricingRoutes } from './routes/pricing.js'
import { registerEnquiriesRoutes } from './routes/enquiries.js'

export function apiPlugin() {
  return {
    name: 'records-api',
    configureServer(server) {
      const app = express()
      app.use(express.json())

      registerAuthRoutes(app)
      registerPricingRoutes(app)
      registerEnquiriesRoutes(app)

      app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() })
      })

      server.middlewares.use(app)
    },
  }
}
