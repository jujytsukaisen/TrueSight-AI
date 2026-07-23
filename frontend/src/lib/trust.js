// Shared logic for turning a 0-100 trust_score into consistent visual
// treatment everywhere it appears (website results, News cards, and the
// browser extension popup all import the same three bands).

export function getTrustBand(score) {
  if (score >= 70) return 'high'
  if (score >= 40) return 'mid'
  return 'low'
}

export const bandStyles = {
  high: { bar: 'bg-signal', soft: 'bg-signal-soft', label: 'text-signal-dark', ring: 'ring-signal/30' },
  mid: { bar: 'bg-amber', soft: 'bg-amber-soft', label: 'text-ink', ring: 'ring-amber/30' },
  low: { bar: 'bg-alert', soft: 'bg-alert-soft', label: 'text-alert', ring: 'ring-alert/30' },
}

export const severityStyles = {
  low: 'bg-ink/[0.06] text-ink/70',
  medium: 'bg-amber-soft text-ink',
  high: 'bg-alert-soft text-alert',
}

// Deterministic PRNG (mulberry32) so the same score always renders the same
// "reading" instead of reshuffling on every re-render.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Builds a row of bar heights (0-100) representing the score as a signal
 * reading: calm and even when trustworthy, jagged and spiky when not.
 */
export function buildSignalBars(score, count = 28) {
  const rand = mulberry32(Math.round(score * 97) + count)
  const risk = 1 - score / 100 // 0 = calm, 1 = maximally jagged
  const baseline = 38 + score * 0.2 // higher score sits a bit taller at rest
  const variance = 8 + risk * 62
  const bars = []
  let prev = baseline
  for (let i = 0; i < count; i++) {
    const jump = (rand() - 0.5) * 2 * variance
    // Blend with the previous bar so low-risk stays smooth (each bar close
    // to the last) while high-risk allows sharp spikes.
    const smoothing = 0.75 - risk * 0.55
    const next = prev * smoothing + (baseline + jump) * (1 - smoothing)
    const clamped = Math.max(6, Math.min(100, next))
    bars.push(clamped)
    prev = clamped
  }
  return bars
}
