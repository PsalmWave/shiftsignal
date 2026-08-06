import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export interface EmptyStateProps {
  icon?: IconName
  title: string
  body: string
  action?: ReactNode
  /**
   * Element used for the title. Stays a paragraph for the in-page empty states,
   * where the surrounding card already owns the heading; the not-found route
   * has no other heading, so it renders this as its `h1`.
   */
  titleAs?: 'p' | 'h1'
}

export function EmptyState({
  icon = 'inbox',
  title,
  body,
  action,
  titleAs: TitleTag = 'p',
}: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">
        <Icon name={icon} size={22} />
      </span>
      <TitleTag className="empty-state-title">{title}</TitleTag>
      <p className="empty-state-body">{body}</p>
      {action}
    </div>
  )
}
