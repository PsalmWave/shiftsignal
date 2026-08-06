import type { ReactNode } from 'react'
import type { Tone } from '@/lib/labels'

export interface BadgeProps {
  tone?: Tone
  dot?: boolean
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', dot = false, children, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()}>
      {dot ? <span className="badge-dot" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}

/** Non-identifying case reference, e.g. "Demo Case A". */
export function CaseChip({ label }: { label: string }) {
  return (
    <span className="case-chip">
      <span aria-hidden="true">◇</span>
      {label}
    </span>
  )
}
