import type { SVGProps } from 'react'

export interface BrandMarkProps extends SVGProps<SVGSVGElement> {
  size?: number
}

/**
 * ShiftSignal mark: two signals passing each other through a relay node — the
 * outgoing shift running in along the top track, the oncoming shift running out
 * along the bottom. Deliberately not a medical cross or any clinical symbol.
 */
export function BrandMark({ size = 28, ...rest }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {/* Pulse ring around the relay point. */}
      <circle cx="12" cy="12" r="10" strokeWidth={1} opacity={0.3} />
      {/* Signal arriving from the outgoing shift. */}
      <path d="M2.4 8h6.4a3.2 3.2 0 0 1 2.4 5.3" opacity={0.55} />
      {/* Signal leaving toward the oncoming shift. */}
      <path d="M21.6 16h-6.4a3.2 3.2 0 0 1-2.4-5.3" />
      {/* The handoff itself. */}
      <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  )
}
