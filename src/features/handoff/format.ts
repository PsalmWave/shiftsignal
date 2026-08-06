import type { HandoffRecord, Task, TeamMember } from '@/types/domain'
import { HANDOFF_SECTIONS, STATUS_LABELS } from '@/lib/labels'
import { formatDateTime } from '@/lib/time'

const DISCLAIMER =
  'ShiftSignal concept demo — administrative workflow organization only. Not a clinical record, ' +
  'not medical guidance, and not a substitute for your institution’s approved documentation.'

export interface HandoffTextInput {
  handoff: HandoffRecord
  from: TeamMember | null
  to: TeamMember | null
  linkedTasks: Task[]
  shiftLabel: string
}

/** Renders a handoff packet as plain text suitable for the clipboard. */
export function handoffToText({
  handoff,
  from,
  to,
  linkedTasks,
  shiftLabel,
}: HandoffTextInput): string {
  const lines: string[] = []

  lines.push(handoff.title.toUpperCase())
  lines.push('='.repeat(Math.max(handoff.title.length, 12)))
  lines.push(`Shift: ${shiftLabel}`)
  lines.push(`From: ${from?.name ?? 'Unassigned'}${from ? ` (${from.role})` : ''}`)
  lines.push(`To: ${to?.name ?? 'Not yet assigned'}${to ? ` (${to.role})` : ''}`)
  if (handoff.caseLabel) lines.push(`Case reference: ${handoff.caseLabel}`)
  lines.push(`Prepared: ${formatDateTime(handoff.updatedAt)}`)
  lines.push('')

  for (const section of HANDOFF_SECTIONS) {
    const value = handoff.sections[section.key].trim()
    lines.push(section.label.toUpperCase())
    lines.push(value || '(not documented)')
    lines.push('')
  }

  if (linkedTasks.length > 0) {
    lines.push('LINKED WORKFLOW TASKS')
    for (const task of linkedTasks) {
      const due = task.dueAt ? ` — due ${formatDateTime(task.dueAt)}` : ''
      lines.push(`- [${STATUS_LABELS[task.status]}] ${task.title}${due}`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push(DISCLAIMER)

  return lines.join('\n')
}

export const HANDOFF_DISCLAIMER = DISCLAIMER
