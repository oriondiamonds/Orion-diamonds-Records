import 'dotenv/config'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import express from 'express'
import app from './app.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Serve built frontend (production only)
app.use(express.static(join(__dirname, '../dist')))
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
