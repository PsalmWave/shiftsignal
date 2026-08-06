import type { SVGProps } from 'react'

/**
 * Inline icon set. Kept local so the demo ships with zero icon dependencies
 * and works fully offline. All paths are drawn on a 24x24 grid.
 */
const PATHS = {
  gauge: 'M12 13.5 16 9M3.5 18a9 9 0 1 1 17 0',
  board: 'M4 5h5v14H4zM10.5 5h5v9h-5zM17 5h3v6h-3z',
  handoff: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M14 11h7m0 0-2.5-2.5M21 11l-2.5 2.5',
  checklist: 'M9 6h11M9 12h11M9 18h11M4 6l1.2 1.2L7.5 4.8M4 12l1.2 1.2 2.3-2.4M4 18l1.2 1.2 2.3-2.4',
  templates: 'M4 6a2 2 0 0 1 2-2h5v16H6a2 2 0 0 1-2-2zM13 4h5a2 2 0 0 1 2 2v4h-7zM13 14h7v4a2 2 0 0 1-2 2h-5z',
  activity: 'M3 12a9 9 0 1 0 2.6-6.3M3 4v4h4M12 7.5V12l3 2',
  team: 'M8 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 8 11ZM2.5 19.5a5.5 5.5 0 0 1 11 0M16 11.2a2.8 2.8 0 1 0 0-5.6M17 14.4a5.2 5.2 0 0 1 4.5 5.1',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5zM4 19.5A2.5 2.5 0 0 0 6.5 22H19v-5',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4',
  close: 'M6 6l12 12M18 6 6 18',
  chevronDown: 'M6 9.5 12 15l6-5.5',
  chevronRight: 'M9.5 6 15 12l-5.5 6',
  chevronUp: 'M6 14.5 12 9l6 5.5',
  arrowRight: 'M4 12h15m0 0-5.5-5.5M19 12l-5.5 5.5',
  arrowUp: 'M12 19V5m0 0-5.5 5.5M12 5l5.5 5.5',
  arrowDown: 'M12 5v14m0 0 5.5-5.5M12 19l-5.5-5.5',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5.2l3.4 2',
  calendar: 'M4 8h16M7 3v3M17 3v3M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
  alert: 'M12 9v4.5M12 17.2v.1M10.3 4.2 2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5M12 7.8v.1',
  check: 'M4.5 12.5 9.5 17.5 19.5 6.5',
  checkCircle: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12.3l2.7 2.7L16 9.7',
  copy: 'M9 9V5.5A1.5 1.5 0 0 1 10.5 4h8A1.5 1.5 0 0 1 20 5.5v8a1.5 1.5 0 0 1-1.5 1.5H15M5.5 9h8A1.5 1.5 0 0 1 15 10.5v8a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 4 18.5v-8A1.5 1.5 0 0 1 5.5 9Z',
  trash: 'M4.5 7h15M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7M6.5 7l.8 12.1a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7M10 11v6M14 11v6',
  edit: 'M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3ZM14.5 7.5l2 2',
  menu: 'M4 7h16M4 12h16M4 17h16',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4',
  shield: 'M12 21s7-3.2 7-8.7V6.1l-7-2.6-7 2.6v6.2C5 17.8 12 21 12 21Z',
  user: 'M12 12.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20.2a7.5 7.5 0 0 1 15 0',
  filter: 'M4 6h16l-6 7v5.5l-4 2V13z',
  file: 'M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z',
  send: 'M20.5 3.5 3.5 10l7 3 3 7 7-16.5ZM10.5 13l4.2-4.2',
  layers: 'M12 3.5 3 8l9 4.5L21 8l-9-4.5ZM3 12.5 12 17l9-4.5M3 17 12 21.5 21 17',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  bell: 'M18 8.5a6 6 0 1 0-12 0c0 5-2 6.5-2 6.5h16s-2-1.5-2-6.5ZM10.3 19a2 2 0 0 0 3.4 0',
  spark: 'M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5 10.1 12.8 4.5 10.9 10.1 9 12 3.5Z',
  link: 'M10.5 13.5a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.6 1.6M13.5 10.5a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.6-1.6',
  inbox: 'M4 13h4l1.5 3h5L16 13h4M4 13 6.4 5.6A2 2 0 0 1 8.3 4.2h7.4a2 2 0 0 1 1.9 1.4L20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5Z',
} as const

export type IconName = keyof typeof PATHS

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
