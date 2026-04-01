const FEED_URL =
  'https://bcast.navkargold.com:7768/VOTSBroadcastStreaming/Services/xml/GetLiveRateByTemplateID/navkar'

const FALLBACK_RATE = 6500  // ₹/gram 24K — used only if feed is down and no cache
const TTL = 5 * 60 * 1000  // 5 minutes

let cache = { rate: null, cachedAt: 0 }

async function fetchFromFeed() {
  const res = await fetch(FEED_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(6000),
  })

  if (!res.ok) throw new Error(`Feed responded ${res.status}`)

  const text = await res.text()

  // Method 1: direct regex on "7594  GOLD 999 IMP  156647"
  const m1 = text.match(/7594\s+GOLD\s+999\s+IMP\s+(\d+)/)
  if (m1) {
    const price10g = parseInt(m1[1])
    if (price10g > 50000 && price10g < 250000) return price10g / 10
  }

  // Method 2: scan lines containing "GOLD 999 IMP", extract trailing number
  const lines = text.split(/[\n\r]+/).filter(l => l.trim())
  for (const line of lines) {
    if (line.includes('GOLD 999 IMP') || (line.includes('GOLD') && line.includes('999'))) {
      const parts = line.split(/\s+|\t+/)
      for (let i = parts.length - 1; i >= 0; i--) {
        const price = parseInt(parts[i])
        if (price > 100000 && price < 250000) return price / 10
      }
    }
  }

  // Method 3: any 6-digit number in the expected 10g price range
  const nums = text.match(/\b\d{6}\b/g)
  if (nums) {
    for (const n of nums) {
      const price = parseInt(n)
      if (price > 100000 && price < 250000) return price / 10
    }
  }

  throw new Error('Could not parse GOLD 999 IMP price from feed')
}

export async function getGoldRate24k(forceRefresh = false) {
  if (!forceRefresh && cache.rate && Date.now() - cache.cachedAt < TTL) {
    return cache.rate
  }
  try {
    const rate = await fetchFromFeed()
    cache = { rate, cachedAt: Date.now() }
    return rate
  } catch (err) {
    console.error('Gold rate fetch failed:', err.message)
    return cache.rate ?? FALLBACK_RATE
  }
}

export function getCachedAt() {
  return cache.cachedAt ? new Date(cache.cachedAt).toISOString() : null
}
