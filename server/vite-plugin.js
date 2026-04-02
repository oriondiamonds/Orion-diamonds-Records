import { config } from 'dotenv'
import app from './app.js'

// Load .env.local into process.env so server-side code can read it.
// Vite only exposes VITE_* vars to import.meta.env (client bundle),
// not to process.env — so we must load it explicitly here.
config({ path: '.env.local' })

export function apiPlugin() {
  return {
    name: 'records-api',
    configureServer(server) {
      server.middlewares.use(app)
    },
  }
}
