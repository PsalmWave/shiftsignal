import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { MOBILE_PRIMARY_COUNT, NAV_ITEMS, NAV_SECTIONS } from './navigation'
import type { NavItem } from './navigation'
import { useDemoStore } from '@/store/useDemoStore'
import { findMember, isOpen } from '@/store/selectors'
import { useIsCompact } from '@/hooks/useMediaQuery'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { Avatar } from '@/components/ui/Avatar'
import { BrandMark } from '@/components/ui/BrandMark'
import { Button, IconButton } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import { formatTime, isOverdue } from '@/lib/time'

type Counters = Record<'openTasks' | 'openHandoffs' | 'activeChecklists', number>

/** Accessible name for a rail/bar link: always the full label, never the short form. */
function linkName(item: NavItem, counters: Counters): string {
  const count = item.counter ? counters[item.counter] : 0
  return count > 0 ? `${item.label}, ${count} open` : item.label
}

export function AppShell() {
  const location = useLocation()
  const isCompact = useIsCompact()
  const { notify } = useToast()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  const members = useDemoStore((state) => state.members)
  const shifts = useDemoStore((state) => state.shifts)
  const tasks = useDemoStore((state) => state.tasks)
  const handoffs = useDemoStore((state) => state.handoffs)
  const checklists = useDemoStore((state) => state.checklists)
  const currentUserId = useDemoStore((state) => state.currentUserId)
  const activeShiftId = useDemoStore((state) => state.activeShiftId)
  const resetDemoData = useDemoStore((state) => state.resetDemoData)

  const currentUser = findMember(members, currentUserId)
  const activeShift = shifts.find((shift) => shift.id === activeShiftId) ?? shifts[0]

  const counters: Counters = useMemo(
    () => ({
      openTasks: tasks.filter(isOpen).length,
      openHandoffs: handoffs.filter((handoff) => handoff.status !== 'handed-off').length,
      activeChecklists: checklists.filter((checklist) => checklist.status === 'active').length,
    }),
    [tasks, handoffs, checklists],
  )

  // Telemetry for the command bar. These are counts of administrative work
  // items only — nothing here reflects clinical urgency.
  const telemetry = useMemo(
    () => ({
      overdue: tasks.filter((task) => isOpen(task) && isOverdue(task.dueAt)).length,
      awaiting: tasks.filter((task) => task.status === 'awaiting-handoff').length,
    }),
    [tasks],
  )

  /** How far through the scheduled shift window the clock currently is, 0-100. */
  const shiftElapsed = useMemo(() => {
    if (!activeShift) return 0
    const start = new Date(activeShift.startsAt).getTime()
    const end = new Date(activeShift.endsAt).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
    const ratio = (Date.now() - start) / (end - start)
    return Math.round(Math.min(1, Math.max(0, ratio)) * 100)
  }, [activeShift])

  const shiftIsLive = activeShift?.status === 'active'

  const primaryItems = NAV_ITEMS.slice(0, MOBILE_PRIMARY_COUNT)
  const overflowItems = NAV_ITEMS.slice(MOBILE_PRIMARY_COUNT)
  const overflowActive = overflowItems.some((item) => location.pathname.startsWith(item.to))

  // Close the overflow sheet whenever the route changes.
  useEffect(() => {
    setSheetOpen(false)
  }, [location.pathname])

  useFocusTrap(sheetRef, {
    active: isCompact && sheetOpen,
    onClose: () => setSheetOpen(false),
  })

  const handleReset = () => {
    resetDemoData()
    setResetOpen(false)
    notify('Demo data reset to the seeded dataset.', 'success')
  }

  const renderCount = (item: NavItem, className: string) => {
    if (!item.counter) return null
    const count = counters[item.counter]
    if (count <= 0) return null
    return (
      <span className={className} aria-hidden="true">
        {count}
      </span>
    )
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      {/* Desktop operations rail. Rendered only on wide viewports so exactly one
          element carries the "Primary" navigation landmark at any time. */}
      {!isCompact ? (
        <nav className="opsrail" aria-label="Primary">
          <div className="rail-brand">
            <span className="brand-mark">
              <BrandMark size={30} />
            </span>
            <span className="brand-name">ShiftSignal</span>
            <span className="brand-tag">Concept demo</span>
          </div>

          <div className="rail-nav">
            {NAV_SECTIONS.map((section) => (
              <div className="rail-section" key={section.label}>
                <p className="rail-section-label">{section.label}</p>
                <ul className="rail-list">
                  {section.items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        aria-label={linkName(item, counters)}
                        className={({ isActive }) =>
                          `rail-link ${isActive ? 'is-active' : ''}`.trim()
                        }
                      >
                        <Icon name={item.icon} size={19} />
                        <span className="rail-link-label">{item.short}</span>
                        {renderCount(item, 'rail-count')}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="rail-foot">
            <div className="rail-user">
              <Avatar member={currentUser} showTitle={false} />
              <span className="rail-user-name truncate">
                {currentUser?.name.split(' ')[0] ?? 'Demo'}
              </span>
              <span className="rail-user-role truncate">RN</span>
            </div>
            <span className="demo-pill">
              <Icon name="shield" size={10} />
              Fictional data only
            </span>
          </div>
        </nav>
      ) : null}

      <div className="app-main">
        {!bannerDismissed ? (
          <div className="demo-banner">
            <Icon name="info" size={14} aria-hidden="true" />
            <span>
              <strong>Concept demonstration.</strong> Not a medical device, EHR, or HIPAA-compliant
              system. All data is fictional and stored only in this browser.
            </span>
            <IconButton
              className="demo-banner-dismiss"
              size="sm"
              label="Dismiss demo notice"
              icon="close"
              onClick={() => setBannerDismissed(true)}
            />
          </div>
        ) : null}

        <header className="commandbar">
          <div className="cb-shift">
            <span
              className={`cb-live ${shiftIsLive ? '' : 'cb-live-idle'}`.trim()}
              aria-hidden="true"
            />
            <div className="cb-shift-text">
              <p className="cb-shift-name truncate">
                {activeShift ? activeShift.label : 'No active shift'}
                <span className="visually-hidden">
                  {shiftIsLive ? ' — shift in progress' : ' — no shift in progress'}
                </span>
              </p>
              {activeShift ? (
                <p className="cb-shift-meta truncate">
                  {activeShift.unit} · {formatTime(activeShift.startsAt)}–
                  {formatTime(activeShift.endsAt)}
                </p>
              ) : null}
            </div>
          </div>

          {activeShift ? (
            <div
              className="cb-elapsed"
              role="img"
              aria-label={`Shift window ${shiftElapsed}% elapsed`}
              title={`Shift window ${shiftElapsed}% elapsed`}
            >
              <span className="cb-elapsed-fill" style={{ width: `${shiftElapsed}%` }} />
            </div>
          ) : null}

          <div className="cb-metrics">
            <div className="cb-metric">
              <span className="cb-metric-value">{counters.openTasks}</span>
              <span className="cb-metric-label">Open</span>
            </div>
            <div className={`cb-metric ${telemetry.overdue > 0 ? 'cb-metric-alert' : ''}`.trim()}>
              <span className="cb-metric-value">{telemetry.overdue}</span>
              <span className="cb-metric-label">Overdue</span>
            </div>
            <div className={`cb-metric ${telemetry.awaiting > 0 ? 'cb-metric-wait' : ''}`.trim()}>
              <span className="cb-metric-value">{telemetry.awaiting}</span>
              <span className="cb-metric-label">Awaiting</span>
            </div>
            <div className="cb-metric">
              <span className="cb-metric-value">{counters.activeChecklists}</span>
              <span className="cb-metric-label">Checklists</span>
            </div>
          </div>

          <div className="cb-actions">
            <Button
              variant="secondary"
              size="sm"
              icon="refresh"
              onClick={() => setResetOpen(true)}
              aria-haspopup="dialog"
              // The visible label is hidden below 640px, which would otherwise leave
              // this as an icon-only button with no accessible name on mobile.
              aria-label="Reset demo data"
            >
              <span className="reset-label">Reset demo data</span>
            </Button>
          </div>
        </header>

        {isCompact && activeShift ? (
          <p className="mobile-shift">
            <Icon name="clock" size={12} aria-hidden="true" />
            {activeShift.unit} · {formatTime(activeShift.startsAt)}–{formatTime(activeShift.endsAt)}
            <span className="spacer" />
            {shiftElapsed}% elapsed
          </p>
        ) : null}

        <main id="main-content" className="app-content" tabIndex={-1}>
          <Outlet />
        </main>

        <footer className="app-footer">
          <div className="app-footer-inner">
            <p>
              ShiftSignal — a fictional workflow concept by Samuel Garcia, RN / Psalm Wave LLC. Not
              affiliated with any health system.
            </p>
            <p>No PHI · No clinical guidance · Local browser storage only</p>
          </div>
        </footer>
      </div>

      {/* Mobile operations bar. Carries the "Primary" landmark on narrow
          viewports; the overflow sheet lives inside it so every destination
          stays within a single navigation landmark. */}
      {isCompact ? (
        <nav className="mobilenav" aria-label="Primary">
          {primaryItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              aria-label={linkName(item, counters)}
              className={({ isActive }) => `mn-link ${isActive ? 'is-active' : ''}`.trim()}
            >
              <Icon name={item.icon} size={20} />
              <span className="mn-label">{item.short}</span>
              {renderCount(item, 'mn-count')}
            </NavLink>
          ))}

          <button
            type="button"
            className={`mn-link ${overflowActive ? 'is-active' : ''}`.trim()}
            onClick={() => setSheetOpen((open) => !open)}
            aria-expanded={sheetOpen}
            aria-label="More destinations"
          >
            <Icon name="grid" size={20} />
            <span className="mn-label">More</span>
          </button>

          {sheetOpen ? (
            <>
              <div className="scrim" onClick={() => setSheetOpen(false)} aria-hidden="true" />
              {/* Scrimmed and focus-trapped, so it is announced as a dialog for
                  the same reason the drawer and modal are. */}
              <div
                className="mobile-sheet"
                role="dialog"
                aria-modal="true"
                aria-labelledby="mobile-sheet-title"
                ref={sheetRef}
              >
                <div className="mobile-sheet-head">
                  <BrandMark size={20} style={{ color: 'var(--signal)' }} />
                  <span className="eyebrow" id="mobile-sheet-title">
                    More destinations
                  </span>
                  <span className="spacer" />
                  <IconButton
                    label="Close menu"
                    icon="close"
                    size="sm"
                    onClick={() => setSheetOpen(false)}
                  />
                </div>
                <ul className="sheet-list">
                  {overflowItems.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        aria-label={linkName(item, counters)}
                        className={({ isActive }) =>
                          `sheet-link ${isActive ? 'is-active' : ''}`.trim()
                        }
                      >
                        <Icon name={item.icon} size={16} />
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : null}
        </nav>
      ) : null}

      <ConfirmDialog
        open={resetOpen}
        title="Reset demo data?"
        message="Every task, handoff, checklist, and template edit you have made in this browser will be replaced with the original seeded demo dataset."
        confirmLabel="Reset demo data"
        destructive
        onConfirm={handleReset}
        onCancel={() => setResetOpen(false)}
      />
    </div>
  )
}
