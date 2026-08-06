import type { ReactNode } from 'react'
import { Icon, type IconName } from '@/components/ui/Icon'

export interface PageHeaderProps {
  eyebrow?: string
  eyebrowIcon?: IconName
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({
  eyebrow,
  eyebrowIcon,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? (
          <p className="page-eyebrow">
            {eyebrowIcon ? <Icon name={eyebrowIcon} size={14} /> : null}
            {eyebrow}
          </p>
        ) : null}
        <h1 className="page-title">{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </header>
  )
}

/** Shared, prominently placed statement of what this tool is not. */
export function SafetyNote({ children }: { children?: ReactNode }) {
  return (
    <div className="callout callout-safety">
      <Icon name="shield" size={16} />
      <span>
        {children ?? (
          <>
            <strong>Administrative organization only.</strong> ShiftSignal does not provide clinical
            guidance, prioritization, or documentation of record. Follow your institution&apos;s
            approved systems and policies.
          </>
        )}
      </span>
    </div>
  )
}
