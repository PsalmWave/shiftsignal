import type { SelectOption } from '@/components/ui/Form'
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
} from '@/lib/labels'
import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from '@/types/domain'
import type { TeamMember } from '@/types/domain'
import { CASE_LABELS } from '@/lib/labels'

export const categoryOptions: SelectOption[] = TASK_CATEGORIES.map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}))

export const priorityOptions: SelectOption[] = TASK_PRIORITIES.map((value) => ({
  value,
  label: PRIORITY_LABELS[value],
}))

export const statusOptions: SelectOption[] = TASK_STATUSES.map((value) => ({
  value,
  label: STATUS_LABELS[value],
}))

export const caseOptions: SelectOption[] = [
  { value: '', label: 'No case reference' },
  ...CASE_LABELS.map((value) => ({ value, label: value })),
]

export function assigneeOptions(members: TeamMember[]): SelectOption[] {
  return [
    { value: '', label: 'Unassigned' },
    ...members.map((member) => ({ value: member.id, label: `${member.name} · ${member.role}` })),
  ]
}

export const withAll = (options: SelectOption[], allLabel: string): SelectOption[] => [
  { value: 'all', label: allLabel },
  ...options,
]
