// Client-side mirror of server/utils/pricing.js rate tables.
// Used for instant per-row price_per_ct display — no API call needed.

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

function findRate(weight, ranges) {
  for (const [min, max, rate] of ranges) {
    if (weight >= min && weight <= max) return rate
  }
  return 0
}

export function getDiamondRatePerCt(shape, weightPerStone) {
  const isRound = ['round', 'rnd', 'r'].includes((shape || '').toLowerCase())
  const ranges = weightPerStone < 1
    ? (isRound ? ROUND_UNDER_1CT : NON_ROUND_UNDER_1CT)
    : (isRound ? ROUND_1CT_PLUS  : NON_ROUND_1CT_PLUS)
  return findRate(weightPerStone, ranges)
}
