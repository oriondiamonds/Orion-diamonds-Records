import { config } from 'dotenv'
import express from 'express'
import { registerAuthRoutes } from './routes/auth.js'
import { registerPricingRoutes } from './routes/pricing.js'
import { registerEnquiriesRoutes } from './routes/enquiries.js'

// Load .env.local into process.env so server-side code can read it.
// Vite only exposes VITE_* vars to import.meta.env (client bundle),
// not to process.env — so we must load it explicitly here.
config({ path: '.env.local' })

export function apiPlugin() {
  return {
    name: 'records-api',
    configureServer(server) {
      const app = express()
      app.use(express.json())

      registerAuthRoutes(app)
      registerPricingRoutes(app)
      registerEnquiriesRoutes(app)

      app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() })
      })

      server.middlewares.use(app)
    },
  }
}
