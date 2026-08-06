import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { IconButton } from './Button'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  eyebrow?: string
  footer?: ReactNode
  headerExtra?: ReactNode
  children: ReactNode
}

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  footer,
  headerExtra,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useFocusTrap(panelRef, { active: open, onClose })

  if (!open) return null

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={panelRef}
      >
        <header className="drawer-header">
          <div style={{ minWidth: 0 }}>
            {eyebrow ? <p className="drawer-eyebrow">{eyebrow}</p> : null}
            <h2 className="drawer-title" id={titleId}>
              {title}
            </h2>
            {headerExtra}
          </div>
          <IconButton label="Close panel" icon="close" onClick={onClose} />
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <div className="drawer-footer">{footer}</div> : null}
      </div>
    </>,
    document.body,
  )
}
