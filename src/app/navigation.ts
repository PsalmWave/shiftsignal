import type { IconName } from '@/components/ui/Icon'

export interface NavItem {
  to: string
  label: string
  /**
   * Short form shown on the narrow operations rail and the mobile bar. The full
   * `label` is always kept as the accessible name so the destination reads the
   * same to screen readers on every breakpoint.
   */
  short: string
  icon: IconName
  /** Which live counter, if any, is shown as a pill next to the label. */
  counter?: 'openTasks' | 'openHandoffs' | 'activeChecklists'
  end?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Shift',
    items: [
      { to: '/', label: 'Shift overview', short: 'Shift', icon: 'gauge', end: true },
      { to: '/tasks', label: 'Task board', short: 'Tasks', icon: 'board', counter: 'openTasks' },
      { to: '/handoff', label: 'Handoffs', short: 'Handoff', icon: 'handoff', counter: 'openHandoffs' },
    ],
  },
  {
    label: 'Workflows',
    items: [
      {
        to: '/checklists',
        label: 'Documentation',
        short: 'Docs',
        icon: 'checklist',
        counter: 'activeChecklists',
      },
      { to: '/templates', label: 'Templates', short: 'Blueprints', icon: 'templates' },
    ],
  },
  {
    label: 'Insight',
    items: [
      { to: '/team', label: 'Team & workload', short: 'Team', icon: 'team' },
      { to: '/activity', label: 'Activity history', short: 'Activity', icon: 'activity' },
      { to: '/case-study', label: 'Case study', short: 'Case', icon: 'book' },
    ],
  },
]

/** Flat order used by the mobile operations bar. */
export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items)

/** The four destinations that earn a slot on the mobile bottom bar. */
export const MOBILE_PRIMARY_COUNT = 4
