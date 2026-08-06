import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export interface StatTileProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: IconName
}

export function StatTile({ label, value, hint, icon }: StatTileProps) {
  return (
    <div className="stat-tile">
      <p className="stat-label">
        {icon ? <Icon name={icon} size={14} /> : null}
        {label}
      </p>
      <p className="stat-value">{value}</p>
      {hint ? <p className="stat-hint">{hint}</p> : null}
    </div>
  )
}
