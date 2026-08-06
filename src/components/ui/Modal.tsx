import { useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Button } from './Button'
import { Icon } from './Icon'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  footer?: ReactNode
  children?: ReactNode
}

export function Modal({ open, onClose, title, description, footer, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const descId = useId()

  useFocusTrap(panelRef, { active: open, onClose })

  if (!open) return null

  return createPortal(
    <>
      <div className="scrim" onClick={onClose} aria-hidden="true" />
      <div className="modal-wrap">
        <div
          className="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descId : undefined}
          ref={panelRef}
        >
          <div className="card-body stack stack-4">
            <div className="stack stack-2">
              <h2 className="card-title" id={titleId}>
                {title}
              </h2>
              {description ? (
                <p className="text-sm text-secondary" id={descId}>
                  {description}
                </p>
              ) : null}
            </div>
            {children}
          </div>
          {footer ? <div className="drawer-footer">{footer}</div> : null}
        </div>
      </div>
    </>,
    document.body,
  )
}

export interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={message}
      footer={
        <>
          <div className="spacer" />
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {destructive ? (
        <div className="callout callout-safety">
          <Icon name="alert" size={16} />
          <span>This only affects locally stored demo data in your browser.</span>
        </div>
      ) : null}
    </Modal>
  )
}
