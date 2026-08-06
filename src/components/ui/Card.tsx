import type { ReactNode } from 'react'

export interface CardProps {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}

export function Card({ children, className = '', as: Tag = 'section' }: CardProps) {
  return <Tag className={`card ${className}`.trim()}>{children}</Tag>
}

export interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  /** Renders without the bottom divider, for headers that sit above padded bodies. */
  plain?: boolean
  /** Heading level used for the title; keeps document outline sane. */
  headingLevel?: 2 | 3 | 4
  id?: string
}

export function CardHeader({
  title,
  subtitle,
  actions,
  plain = false,
  headingLevel = 3,
  id,
}: CardHeaderProps) {
  const Heading = `h${headingLevel}` as const

  return (
    <header className={`card-header ${plain ? 'card-header-plain' : ''}`.trim()}>
      <div>
        <Heading className="card-title" id={id}>
          {title}
        </Heading>
        {subtitle ? <p className="card-subtitle">{subtitle}</p> : null}
      </div>
      {actions ? <div className="row row-wrap">{actions}</div> : null}
    </header>
  )
}

export function CardBody({
  children,
  className = '',
  flush = false,
}: {
  children: ReactNode
  className?: string
  flush?: boolean
}) {
  return (
    <div className={`card-body ${flush ? 'card-body-flush' : ''} ${className}`.trim()}>
      {children}
    </div>
  )
}

export function CardFooter({ children }: { children: ReactNode }) {
  return <footer className="card-footer">{children}</footer>
}
