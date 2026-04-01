import { createClient } from '@supabase/supabase-js'

let _client = null

function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return _client
}

// Proxy defers createClient() until first property access (i.e. first request),
// by which point Vite has loaded .env.local — so process.env is populated.
export default new Proxy({}, {
  get(_, prop) {
    return getClient()[prop]
  },
})
