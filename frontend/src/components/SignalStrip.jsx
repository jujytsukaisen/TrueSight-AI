import { useMemo } from 'react'
import { buildSignalBars, getTrustBand, bandStyles } from '../lib/trust'

/**
 * The product's signature visual: a Trust Score rendered as a signal
 * reading rather than a generic ring gauge. Trustworthy content reads as a
 * calm, even line; manipulative content reads as jagged and spiking — the
 * shape argues the score, it doesn't just decorate it.
 */
export default function SignalStrip({ score, height = 56, barCount = 28, className = '' }) {
  const bars = useMemo(() => buildSignalBars(score, barCount), [score, barCount])
  const band = getTrustBand(score)
  const style = bandStyles[band]

  return (
    <div
      className={`flex items-end gap-[3px] ${className}`}
      style={{ height }}
      role="img"
      aria-label={`Signal reading, ${score} out of 100`}
    >
      {bars.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full ${style.bar} opacity-90 first:opacity-60 last:opacity-60`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}
