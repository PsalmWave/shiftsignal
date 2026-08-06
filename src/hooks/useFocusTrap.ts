import { useEffect, useRef, type RefObject } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  )
}

/**
 * Traps Tab focus inside `ref`, closes on Escape, restores focus to the
 * previously active element, and locks background scrolling.
 *
 * `onClose` is read through a ref so that an inline arrow function from the
 * caller does not re-run the effect on every parent render — which would
 * otherwise yank focus back to the first field on every keystroke.
 */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  { active, onClose }: { active: boolean; onClose: () => void },
): void {
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!active) return

    const container = ref.current
    const previouslyFocused = document.activeElement as HTMLElement | null

    // Move focus into the overlay on open.
    const initial = container ? focusableWithin(container)[0] : null
    if (initial) {
      initial.focus()
    } else if (container) {
      container.setAttribute('tabindex', '-1')
      container.focus()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab' || !container) return

      const focusables = focusableWithin(container)
      if (focusables.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const activeEl = document.activeElement

      if (event.shiftKey && (activeEl === first || !container.contains(activeEl))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [active, ref])
}
