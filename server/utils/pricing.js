// ─── Diamond rate tables (exact values from Orion src/utils/price.js) ────────
// Format: [min, max, rate_per_ct]

const ROUND_UNDER_1CT = [
  [0.001, 0.005, 13500],
  [0.006, 0.009, 11600],
  [0.01,  0.02,  6900],
  [0.025, 0.035, 4600],
  [0.04,  0.07,  4600],
  [0.08,  0.09,  4600],
  [0.1,   0.12,  5100],
  [0.13,  0.17,  5100],
  [0.18,  0.22,  6200],
  [0.23,  0.29,  7000],
  [0.3,   0.39,  6750],
  [0.4,   0.49,  6750],
  [0.5,   0.69,  7100],
  [0.7,   0.89,  7100],
  [0.9,   0.99,  7300],
]

const ROUND_1CT_PLUS = [
  [1.0, 1.99, 11000],
  [2.0, 2.99, 12500],
  [3.0, 3.99, 13750],
  [4.0, 4.99, 14550],
  [5.0, 5.99, 15500],
]

const NON_ROUND_UNDER_1CT = [
  [0.001, 0.99, 7800],
]

const NON_ROUND_1CT_PLUS = [
  [1.0, 1.99, 11500],
  [2.0, 2.99, 13500],
  [3.0, 3.99, 14550],
  [4.0, 4.99, 15550],
  [5.0, 5.99, 16500],
]

// ─── Tier margins ─────────────────────────────────────────────────────────────

const TIERS = {
  lessThan1ct:    { multiplier: 2.2, flatAddition: 900 },
  greaterThan1ct: { multiplier: 2.7, flatAddition: 0 },
  greaterThan2ct: { multiplier: 2.8, flatAddition: 0 },
  greaterThan3ct: { multiplier: 2.9, flatAddition: 0 },
  greaterThan4ct: { multiplier: 3.0, flatAddition: 0 },
  greaterThan5ct: { multiplier: 3.2, flatAddition: 0 },
}

const BASE_FEES = { fee1: 150, fee2: 700 }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findRate(weight, ranges) {
  for (const [min, max, rate] of ranges) {
    if (weight >= min && weight <= max) return rate
  }
  return 0
}

function getDiamondTier(weight) {
  if (weight < 1) return TIERS.lessThan1ct
  if (weight < 2) return TIERS.greaterThan1ct
  if (weight < 3) return TIERS.greaterThan2ct
  if (weight < 4) return TIERS.greaterThan3ct
  if (weight < 5) return TIERS.greaterThan4ct
  return TIERS.greaterThan5ct
}

// ─── Exports ─────────────────────────────────────────────────────────────────

/**
 * Returns the base rate per carat for a single stone (no margin applied).
 * Used for display purposes in the enquiry form rows.
 */
export function getDiamondRatePerCt(shape, weightPerStone) {
  const isRound = ['round', 'rnd', 'r'].includes(shape.toLowerCase())
  const ranges = weightPerStone < 1
    ? (isRound ? ROUND_UNDER_1CT : NON_ROUND_UNDER_1CT)
    : (isRound ? ROUND_1CT_PLUS  : NON_ROUND_1CT_PLUS)
  return findRate(weightPerStone, ranges)
}

/**
 * Full price breakdown. Pure sync — caller must pass goldRate24k.
 *
 * @param {object} input
 * @param {{ shape: string, count: number, weightPerStone: number }[]} input.diamonds
 * @param {number}  input.metalWeight   grams
 * @param {string}  input.metalType     'Gold' | 'Silver'
 * @param {string}  input.karat         '10k' | '14k' | '18k' | '22k' | 'silver'
 * @param {number}  input.goldRate24k   ₹ per gram of 24K gold
 * @returns {{ diamondTotal, goldTotal, makingCharges, subtotal, gstAmount, totalPrice }}
 */
export function calculateEnquiryPrice({ diamonds = [], metalWeight = 0, metalType = 'Gold', karat = '18k', goldRate24k = 0 }) {
  // ── Diamond total ──
  let diamondTotal = 0
  for (const d of diamonds) {
    const count = parseInt(d.count) || 0
    const weight = parseFloat(d.weightPerStone) || 0
    if (count <= 0 || weight <= 0) continue

    const rate = getDiamondRatePerCt(d.shape || 'Round', weight)
    const base = weight * count * rate
    const tier = getDiamondTier(weight)
    diamondTotal += (base * tier.multiplier) + tier.flatAddition
  }
  if (diamonds.some(d => parseInt(d.count) > 0 && parseFloat(d.weightPerStone) > 0)) {
    diamondTotal += BASE_FEES.fee1 + BASE_FEES.fee2
  }

  // ── Metal total ──
  let goldTotal = 0
  const weight = parseFloat(metalWeight) || 0
  if (weight > 0) {
    if (metalType === 'Silver') {
      goldTotal = weight * 100  // flat ₹100/g for silver
    } else {
      const karatNum = parseInt(karat) || 18
      goldTotal = weight * (karatNum / 24) * goldRate24k
    }
  }

  // ── Making charges ──
  const ratePerGram = weight >= 2 ? 700 : 950
  const makingCharges = weight * ratePerGram * 1.75

  // ── GST & total ──
  const subtotal = diamondTotal + goldTotal + makingCharges
  const gstAmount = subtotal * 0.03
  const totalPrice = subtotal + gstAmount

  return {
    diamondTotal:  Math.round(diamondTotal),
    goldTotal:     Math.round(goldTotal),
    makingCharges: Math.round(makingCharges),
    subtotal:      Math.round(subtotal),
    gstAmount:     Math.round(gstAmount),
    totalPrice:    Math.round(totalPrice),
  }
}
