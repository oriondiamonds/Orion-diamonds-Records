import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { registerAuthRoutes } from './routes/auth.js'
import { registerPricingRoutes } from './routes/pricing.js'
import { registerEnquiriesRoutes } from './routes/enquiries.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(express.json())

registerAuthRoutes(app)
registerPricingRoutes(app)
registerEnquiriesRoutes(app)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve static frontend build
app.use(express.static(join(__dirname, '../dist')))
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
