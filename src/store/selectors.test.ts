import { describe, expect, it } from 'vitest'

import { buildSeedState } from '@/data/seed'
import {
  DEFAULT_TASK_FILTERS,
  checklistProgress,
  countActiveFilters,
  countByCategory,
  filterTasks,
  sortTasks,
  summarizeChecklists,
  summarizeHandoffs,
  summarizeTasks,
  workloadByMember,
} from './selectors'

const state = buildSeedState(new Date())

describe('filterTasks', () => {
  it('returns everything with the default filters', () => {
    expect(filterTasks(state.tasks, DEFAULT_TASK_FILTERS, state.members)).toHaveLength(
      state.tasks.length,
    )
  })

  it('matches free-text search across title, notes, and assignee name', () => {
    const byTitle = filterTasks(
      state.tasks,
      { ...DEFAULT_TASK_FILTERS, search: 'telemetry' },
      state.members,
    )
    expect(byTitle).toHaveLength(1)
    expect(byTitle[0].id).toBe('t-03')

    const byNote = filterTasks(
      state.tasks,
      { ...DEFAULT_TASK_FILTERS, search: 'placement desk is between coverage' },
      state.members,
    )
    expect(byNote.map((t) => t.id)).toContain('t-04')

    const byAssignee = filterTasks(
      state.tasks,
      { ...DEFAULT_TASK_FILTERS, search: 'Joyce Lin' },
      state.members,
    )
    expect(byAssignee.length).toBeGreaterThan(0)
    expect(byAssignee.every((task) => task.assigneeId === 'm-joyce')).toBe(true)
  })

  it('filters by category, status, priority, and shift', () => {
    const equipment = filterTasks(
      state.tasks,
      { ...DEFAULT_TASK_FILTERS, category: 'equipment' },
      state.members,
    )
    expect(equipment.every((task) => task.category === 'equipment')).toBe(true)

    const blocked = filterTasks(
      state.tasks,
      { ...DEFAULT_TASK_FILTERS, status: 'blocked' },
      state.members,
    )
    expect(blocked.every((task) => task.status === 'blocked')).toBe(true)

    const high = filterTasks(
      state.tasks,
      { ...DEFAULT_TASK_FILTERS, priority: 'high' },
      state.members,
    )
    expect(high.every((task) => task.priority === 'high')).toBe(true)

    const nightShift = filterTasks(
      state.tasks,
      { ...DEFAULT_TASK_FILTERS, shiftId: 's-night' },
      state.members,
    )
    expect(nightShift.every((task) => task.shiftId === 's-night')).toBe(true)
    expect(nightShift.length).toBeGreaterThan(0)
  })

  it('supports the unassigned pseudo-assignee', () => {
    const unassigned = filterTasks(
      state.tasks,
      { ...DEFAULT_TASK_FILTERS, assigneeId: 'unassigned' },
      state.members,
    )
    expect(unassigned.length).toBeGreaterThan(0)
    expect(unassigned.every((task) => task.assigneeId === null)).toBe(true)
  })

  it('counts how many filters are active', () => {
    expect(countActiveFilters(DEFAULT_TASK_FILTERS)).toBe(0)
    expect(
      countActiveFilters({ ...DEFAULT_TASK_FILTERS, search: 'x', category: 'equipment' }),
    ).toBe(2)
  })
})

describe('sortTasks', () => {
  it('orders dated tasks before undated ones', () => {
    const sorted = sortTasks(state.tasks)
    const firstUndated = sorted.findIndex((task) => task.dueAt === null)
    if (firstUndated !== -1) {
      expect(sorted.slice(firstUndated).every((task) => task.dueAt === null)).toBe(true)
    }
    const dated = sorted.filter((task) => task.dueAt)
    for (let i = 1; i < dated.length; i += 1) {
      expect(dated[i - 1].dueAt! <= dated[i].dueAt!).toBe(true)
    }
  })
})

describe('aggregates', () => {
  it('summarizes task counts and completion rate', () => {
    const summary = summarizeTasks(state.tasks)
    expect(summary.total).toBe(state.tasks.length)
    expect(summary.complete).toBe(state.tasks.filter((t) => t.status === 'complete').length)
    expect(summary.completionRate).toBe(Math.round((summary.complete / summary.total) * 100))
    expect(summary.awaitingHandoff).toBeGreaterThan(0)
  })

  it('handles an empty task list without dividing by zero', () => {
    const summary = summarizeTasks([])
    expect(summary.total).toBe(0)
    expect(summary.completionRate).toBe(0)
  })

  it('counts every category, including empty ones', () => {
    const counts = countByCategory(state.tasks)
    expect(counts).toHaveLength(7)
    const total = counts.reduce((acc, entry) => acc + entry.total, 0)
    expect(total).toBe(state.tasks.length)
  })

  it('reports workload per member sorted by volume', () => {
    const workload = workloadByMember(state.members, state.tasks, state.checklists)
    expect(workload).toHaveLength(state.members.length)
    for (let i = 1; i < workload.length; i += 1) {
      expect(workload[i - 1].total).toBeGreaterThanOrEqual(workload[i].total)
    }
    const assignedTotal = workload.reduce((acc, entry) => acc + entry.total, 0)
    expect(assignedTotal).toBe(state.tasks.filter((t) => t.assigneeId !== null).length)
  })

  it('computes checklist progress and documentation rollups', () => {
    const checklist = state.checklists.find((c) => c.id === 'cl-01')!
    const progress = checklistProgress(checklist)
    expect(progress.total).toBe(checklist.steps.length)
    expect(progress.completed).toBe(4)
    expect(progress.percent).toBe(Math.round((4 / checklist.steps.length) * 100))

    const summary = summarizeChecklists(state.checklists)
    expect(summary.checklists).toBe(state.checklists.length)
    expect(summary.complete).toBeGreaterThan(0)
    expect(summary.percent).toBeGreaterThan(0)
  })

  it('summarizes handoff completion', () => {
    const summary = summarizeHandoffs(state.handoffs)
    expect(summary.total).toBe(state.handoffs.length)
    expect(summary.draft + summary.ready + summary.handedOff).toBe(summary.total)
    expect(summary.percent).toBe(Math.round((summary.handedOff / summary.total) * 100))
  })
})
