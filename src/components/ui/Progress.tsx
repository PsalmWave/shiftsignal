export interface ProgressProps {
  value: number
  max?: number
  label: string
  /** Renders the "n of m" + percentage row above the bar. */
  showMeta?: boolean
  metaLeft?: string
  size?: 'sm' | 'md'
}

export function Progress({
  value,
  max = 100,
  label,
  showMeta = false,
  metaLeft,
  size = 'md',
}: ProgressProps) {
  const safeMax = max <= 0 ? 1 : max
  const clamped = Math.max(0, Math.min(value, safeMax))
  const percent = Math.round((clamped / safeMax) * 100)

  return (
    <div className="stack stack-2">
      {showMeta ? (
        <div className="progress-meta">
          <span>{metaLeft ?? label}</span>
          <span>{percent}%</span>
        </div>
      ) : null}
      <div
        className={`progress ${size === 'sm' ? 'progress-sm' : ''}`.trim()}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        aria-valuetext={`${percent} percent complete`}
      >
        <div
          className={`progress-bar ${percent === 100 ? 'is-complete' : ''}`.trim()}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
