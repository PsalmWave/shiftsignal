import type {
  Checklist,
  HandoffRecord,
  ID,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TeamMember,
} from '@/types/domain'
import { TASK_CATEGORIES } from '@/types/domain'
import { isOverdue } from '@/lib/time'

/* ------------------------------------------------------------------ *
 * Task filtering
 * ------------------------------------------------------------------ */

export interface TaskFilters {
  search: string
  category: TaskCategory | 'all'
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  assigneeId: ID | 'all' | 'unassigned'
  shiftId: ID | 'all'
}

export const DEFAULT_TASK_FILTERS: TaskFilters = {
  search: '',
  category: 'all',
  status: 'all',
  priority: 'all',
  assigneeId: 'all',
  shiftId: 'all',
}

export function countActiveFilters(filters: TaskFilters): number {
  let count = 0
  if (filters.search.trim()) count += 1
  if (filters.category !== 'all') count += 1
  if (filters.status !== 'all') count += 1
  if (filters.priority !== 'all') count += 1
  if (filters.assigneeId !== 'all') count += 1
  if (filters.shiftId !== 'all') count += 1
  return count
}

export function filterTasks(tasks: Task[], filters: TaskFilters, members: TeamMember[]): Task[] {
  const query = filters.search.trim().toLowerCase()
  const memberById = new Map(members.map((m) => [m.id, m]))

  return tasks.filter((task) => {
    if (filters.category !== 'all' && task.category !== filters.category) return false
    if (filters.status !== 'all' && task.status !== filters.status) return false
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false
    if (filters.shiftId !== 'all' && task.shiftId !== filters.shiftId) return false

    if (filters.assigneeId === 'unassigned') {
      if (task.assigneeId !== null) return false
    } else if (filters.assigneeId !== 'all' && task.assigneeId !== filters.assigneeId) {
      return false
    }

    if (query) {
      const assigneeName = task.assigneeId
        ? (memberById.get(task.assigneeId)?.name ?? '')
        : 'unassigned'
      const haystack = [
        task.title,
        task.description,
        task.caseLabel ?? '',
        assigneeName,
        task.category,
        ...task.notes.map((n) => n.body),
      ]
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })
}

/** Sorts by due time (soonest first, undated last), then by priority. */
const PRIORITY_WEIGHT: Record<TaskPriority, number> = { high: 0, normal: 1, low: 2 }

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.dueAt && b.dueAt) {
      const delta = a.dueAt.localeCompare(b.dueAt)
      if (delta !== 0) return delta
    } else if (a.dueAt !== b.dueAt) {
      return a.dueAt ? -1 : 1
    }
    const weight = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
    if (weight !== 0) return weight
    return a.title.localeCompare(b.title)
  })
}

/* ------------------------------------------------------------------ *
 * Aggregates
 * ------------------------------------------------------------------ */

export const OPEN_STATUSES: TaskStatus[] = ['open', 'in-progress', 'blocked', 'awaiting-handoff']

export function isOpen(task: Task): boolean {
  return task.status !== 'complete'
}

export interface TaskSummary {
  total: number
  open: number
  inProgress: number
  blocked: number
  awaitingHandoff: number
  complete: number
  overdue: number
  unassigned: number
  completionRate: number
}

export function summarizeTasks(tasks: Task[], now: Date = new Date()): TaskSummary {
  const total = tasks.length
  const complete = tasks.filter((t) => t.status === 'complete').length
  return {
    total,
    open: tasks.filter((t) => t.status === 'open').length,
    inProgress: tasks.filter((t) => t.status === 'in-progress').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    awaitingHandoff: tasks.filter((t) => t.status === 'awaiting-handoff').length,
    complete,
    overdue: tasks.filter((t) => isOpen(t) && isOverdue(t.dueAt, now)).length,
    unassigned: tasks.filter((t) => isOpen(t) && t.assigneeId === null).length,
    completionRate: total === 0 ? 0 : Math.round((complete / total) * 100),
  }
}

export interface CategoryCount {
  category: TaskCategory
  open: number
  complete: number
  total: number
}

export function countByCategory(tasks: Task[]): CategoryCount[] {
  return TASK_CATEGORIES.map((category) => {
    const inCategory = tasks.filter((t) => t.category === category)
    const complete = inCategory.filter((t) => t.status === 'complete').length
    return {
      category,
      open: inCategory.length - complete,
      complete,
      total: inCategory.length,
    }
  })
}

export interface MemberWorkload {
  member: TeamMember
  open: number
  inProgress: number
  blocked: number
  awaitingHandoff: number
  complete: number
  overdue: number
  total: number
  checklistSteps: number
  completionRate: number
}

export function workloadByMember(
  members: TeamMember[],
  tasks: Task[],
  checklists: Checklist[],
  now: Date = new Date(),
): MemberWorkload[] {
  return members
    .map((member) => {
      const own = tasks.filter((t) => t.assigneeId === member.id)
      const complete = own.filter((t) => t.status === 'complete').length
      const checklistSteps = checklists.reduce(
        (acc, checklist) =>
          acc +
          checklist.steps.filter((step) => step.assigneeId === member.id && !step.complete).length,
        0,
      )
      return {
        member,
        open: own.filter((t) => t.status === 'open').length,
        inProgress: own.filter((t) => t.status === 'in-progress').length,
        blocked: own.filter((t) => t.status === 'blocked').length,
        awaitingHandoff: own.filter((t) => t.status === 'awaiting-handoff').length,
        complete,
        overdue: own.filter((t) => isOpen(t) && isOverdue(t.dueAt, now)).length,
        total: own.length,
        checklistSteps,
        completionRate: own.length === 0 ? 0 : Math.round((complete / own.length) * 100),
      }
    })
    .sort((a, b) => b.total - a.total || a.member.name.localeCompare(b.member.name))
}

export interface ChecklistProgress {
  completed: number
  total: number
  percent: number
}

export function checklistProgress(checklist: Checklist): ChecklistProgress {
  const total = checklist.steps.length
  const completed = checklist.steps.filter((s) => s.complete).length
  return {
    completed,
    total,
    percent: total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}

export interface DocumentationSummary {
  checklists: number
  active: number
  complete: number
  steps: number
  completedSteps: number
  percent: number
}

export function summarizeChecklists(checklists: Checklist[]): DocumentationSummary {
  const relevant = checklists.filter((c) => c.status !== 'archived')
  const steps = relevant.reduce((acc, c) => acc + c.steps.length, 0)
  const completedSteps = relevant.reduce(
    (acc, c) => acc + c.steps.filter((s) => s.complete).length,
    0,
  )
  return {
    checklists: relevant.length,
    active: relevant.filter((c) => c.status === 'active').length,
    complete: relevant.filter((c) => c.status === 'complete').length,
    steps,
    completedSteps,
    percent: steps === 0 ? 0 : Math.round((completedSteps / steps) * 100),
  }
}

export interface HandoffSummary {
  total: number
  draft: number
  ready: number
  handedOff: number
  percent: number
}

export function summarizeHandoffs(handoffs: HandoffRecord[]): HandoffSummary {
  const total = handoffs.length
  const handedOff = handoffs.filter((h) => h.status === 'handed-off').length
  return {
    total,
    draft: handoffs.filter((h) => h.status === 'draft').length,
    ready: handoffs.filter((h) => h.status === 'ready').length,
    handedOff,
    percent: total === 0 ? 0 : Math.round((handedOff / total) * 100),
  }
}

/* ------------------------------------------------------------------ *
 * Lookups
 * ------------------------------------------------------------------ */

export function memberLookup(members: TeamMember[]): Map<ID, TeamMember> {
  return new Map(members.map((m) => [m.id, m]))
}

export function findMember(members: TeamMember[], id: ID | null): TeamMember | null {
  if (!id) return null
  return members.find((m) => m.id === id) ?? null
}
