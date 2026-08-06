import { beforeEach, describe, expect, it } from 'vitest'

import { useDemoStore } from './useDemoStore'
import { resetStore } from '@/test/utils'

const store = () => useDemoStore.getState()

beforeEach(() => {
  resetStore()
})

describe('task actions', () => {
  it('creates a task on the active shift and logs activity', () => {
    const before = store().tasks.length
    const task = store().createTask({
      title: '  Update the on-call binder  ',
      description: ' Two desk numbers changed. ',
      category: 'administrative',
      priority: 'low',
      status: 'open',
      assigneeId: 'm-marcus',
      caseLabel: null,
      dueAt: null,
    })

    expect(store().tasks).toHaveLength(before + 1)
    expect(task.title).toBe('Update the on-call binder')
    expect(task.description).toBe('Two desk numbers changed.')
    expect(task.shiftId).toBe(store().activeShiftId)
    expect(task.completedAt).toBeNull()

    const event = store().activity[0]
    expect(event.entity).toBe('task')
    expect(event.kind).toBe('created')
    expect(event.summary).toContain('Update the on-call binder')
  })

  it('stamps completedAt when a task is completed and clears it when reopened', () => {
    store().setTaskStatus('t-02', 'complete')
    const completed = store().tasks.find((t) => t.id === 't-02')!
    expect(completed.status).toBe('complete')
    expect(completed.completedAt).not.toBeNull()
    expect(store().activity[0].kind).toBe('completed')

    store().setTaskStatus('t-02', 'open')
    const reopened = store().tasks.find((t) => t.id === 't-02')!
    expect(reopened.status).toBe('open')
    expect(reopened.completedAt).toBeNull()
    expect(store().activity[0].kind).toBe('reopened')
  })

  it('ignores a status change that would be a no-op', () => {
    const activityBefore = store().activity.length
    store().setTaskStatus('t-02', 'open')
    expect(store().activity).toHaveLength(activityBefore)
  })

  it('logs an assignment change when the assignee moves', () => {
    store().updateTask('t-02', { assigneeId: 'm-priya' })
    expect(store().tasks.find((t) => t.id === 't-02')!.assigneeId).toBe('m-priya')
    expect(store().activity[0].kind).toBe('assigned')
    expect(store().activity[0].detail).toContain('Priya Raman')
  })

  it('appends notes and ignores empty ones', () => {
    const before = store().tasks.find((t) => t.id === 't-02')!.notes.length
    store().addTaskNote('t-02', '   ')
    expect(store().tasks.find((t) => t.id === 't-02')!.notes).toHaveLength(before)

    store().addTaskNote('t-02', '  Called records; packet is in the scanning queue.  ')
    const notes = store().tasks.find((t) => t.id === 't-02')!.notes
    expect(notes).toHaveLength(before + 1)
    expect(notes.at(-1)!.body).toBe('Called records; packet is in the scanning queue.')
    expect(notes.at(-1)!.authorId).toBe(store().currentUserId)
  })

  it('unlinks a deleted task from handoff packets', () => {
    expect(store().handoffs.find((h) => h.id === 'h-01')!.linkedTaskIds).toContain('t-04')
    store().deleteTask('t-04')
    expect(store().tasks.find((t) => t.id === 't-04')).toBeUndefined()
    expect(store().handoffs.find((h) => h.id === 'h-01')!.linkedTaskIds).not.toContain('t-04')
  })
})

describe('handoff actions', () => {
  it('creates a draft and links tasks by toggle', () => {
    const record = store().createHandoff({
      title: 'Evening coordination handoff',
      fromMemberId: 'm-samuel',
      toMemberId: null,
      caseLabel: null,
    })
    expect(record.status).toBe('draft')
    expect(record.linkedTaskIds).toEqual([])

    store().toggleHandoffTask(record.id, 't-06')
    expect(store().handoffs.find((h) => h.id === record.id)!.linkedTaskIds).toEqual(['t-06'])

    store().toggleHandoffTask(record.id, 't-06')
    expect(store().handoffs.find((h) => h.id === record.id)!.linkedTaskIds).toEqual([])
  })

  it('moves a record through ready and handed-off states', () => {
    store().setHandoffReady('h-01', true)
    expect(store().handoffs.find((h) => h.id === 'h-01')!.status).toBe('ready')

    store().markHandedOff('h-01')
    const handed = store().handoffs.find((h) => h.id === 'h-01')!
    expect(handed.status).toBe('handed-off')
    expect(handed.handedOffAt).not.toBeNull()
    expect(store().activity[0].kind).toBe('handed-off')
  })

  it('refuses to re-open a record that is already handed off', () => {
    const before = store().handoffs.find((h) => h.id === 'h-03')!
    store().setHandoffReady('h-03', false)
    expect(store().handoffs.find((h) => h.id === 'h-03')!.status).toBe(before.status)
  })

  it('saves section edits', () => {
    store().updateHandoffSections('h-01', { background: 'Transport request submitted at 14:10.' })
    expect(store().handoffs.find((h) => h.id === 'h-01')!.sections.background).toBe(
      'Transport request submitted at 14:10.',
    )
    expect(store().handoffs.find((h) => h.id === 'h-01')!.sections.situation).not.toBe('')
  })
})

describe('checklist actions', () => {
  it('creates a checklist from a template using only enabled steps', () => {
    const template = store().templates.find((t) => t.id === 'tpl-shift-change')!
    const enabled = template.steps.filter((step) => step.enabled).length
    expect(enabled).toBeLessThan(template.steps.length)

    const checklist = store().createChecklistFromTemplate('tpl-shift-change', {
      title: 'Shift-change prep — evening',
      caseLabel: null,
    })!

    expect(checklist.steps).toHaveLength(enabled)
    expect(checklist.status).toBe('active')
    expect(checklist.steps.every((step) => !step.complete)).toBe(true)
  })

  it('returns null for an unknown template', () => {
    expect(store().createChecklistFromTemplate('nope', { title: 'x', caseLabel: null })).toBeNull()
  })

  it('marks a checklist complete once every step is checked', () => {
    const checklist = store().createChecklistFromTemplate('tpl-equipment', {
      title: 'Equipment handoff — test',
      caseLabel: null,
    })!

    for (const step of checklist.steps) {
      store().toggleChecklistStep(checklist.id, step.id)
    }

    const updated = store().checklists.find((c) => c.id === checklist.id)!
    expect(updated.status).toBe('complete')
    expect(updated.completedAt).not.toBeNull()

    // Unchecking one step returns it to active.
    store().toggleChecklistStep(checklist.id, checklist.steps[0].id)
    const reopened = store().checklists.find((c) => c.id === checklist.id)!
    expect(reopened.status).toBe('active')
    expect(reopened.completedAt).toBeNull()
  })

  it('stores per-step assignee and note', () => {
    const checklist = store().checklists.find((c) => c.id === 'cl-04')!
    const step = checklist.steps[0]
    store().updateChecklistStep(checklist.id, step.id, {
      assigneeId: 'm-joyce',
      note: 'Receiving contact confirmed.',
    })
    const updated = store().checklists.find((c) => c.id === 'cl-04')!.steps[0]
    expect(updated.assigneeId).toBe('m-joyce')
    expect(updated.note).toBe('Receiving contact confirmed.')
  })
})

describe('template actions', () => {
  it('duplicates a template with fresh step ids and an editable copy flag', () => {
    const source = store().templates.find((t) => t.id === 'tpl-admission')!
    const copy = store().duplicateTemplate('tpl-admission')!

    expect(copy.name).toBe(`${source.name} (copy)`)
    expect(copy.isSeeded).toBe(false)
    expect(copy.steps).toHaveLength(source.steps.length)
    expect(copy.steps.map((s) => s.id)).not.toEqual(source.steps.map((s) => s.id))
  })

  it('adds, edits, reorders, and removes steps', () => {
    const id = 'tpl-equipment'
    const originalLength = store().templates.find((t) => t.id === id)!.steps.length

    store().addTemplateStep(id, '  Confirm the loading dock contact  ')
    let steps = store().templates.find((t) => t.id === id)!.steps
    expect(steps).toHaveLength(originalLength + 1)
    expect(steps.at(-1)!.label).toBe('Confirm the loading dock contact')

    store().addTemplateStep(id, '   ')
    expect(store().templates.find((t) => t.id === id)!.steps).toHaveLength(originalLength + 1)

    const target = steps.at(-1)!
    store().updateTemplateStep(id, target.id, { enabled: false, hint: 'Dock closes at 18:00.' })
    const updated = store().templates.find((t) => t.id === id)!.steps.at(-1)!
    expect(updated.enabled).toBe(false)
    expect(updated.hint).toBe('Dock closes at 18:00.')

    const firstId = steps[0].id
    store().moveTemplateStep(id, firstId, 1)
    expect(store().templates.find((t) => t.id === id)!.steps[1].id).toBe(firstId)

    // Moving past the boundary is a no-op.
    store().moveTemplateStep(id, store().templates.find((t) => t.id === id)!.steps[0].id, -1)
    expect(store().templates.find((t) => t.id === id)!.steps[1].id).toBe(firstId)

    store().removeTemplateStep(id, target.id)
    expect(store().templates.find((t) => t.id === id)!.steps).toHaveLength(originalLength)
  })

  it('protects seeded templates from deletion but allows deleting copies', () => {
    store().deleteTemplate('tpl-admission')
    expect(store().templates.find((t) => t.id === 'tpl-admission')).toBeDefined()

    const copy = store().duplicateTemplate('tpl-admission')!
    store().deleteTemplate(copy.id)
    expect(store().templates.find((t) => t.id === copy.id)).toBeUndefined()
  })
})

describe('demo controls', () => {
  it('restores the seeded dataset and records a reset event', () => {
    store().createTask({
      title: 'Temporary demo task',
      description: '',
      category: 'administrative',
      priority: 'normal',
      status: 'open',
      assigneeId: null,
      caseLabel: null,
      dueAt: null,
    })
    store().deleteTask('t-01')
    expect(store().tasks.find((t) => t.id === 't-01')).toBeUndefined()

    store().resetDemoData()

    expect(store().tasks.find((t) => t.id === 't-01')).toBeDefined()
    expect(store().tasks.find((t) => t.title === 'Temporary demo task')).toBeUndefined()
    expect(store().activity[0].kind).toBe('reset')
    expect(store().templates).toHaveLength(6)
  })

  it('persists state to localStorage under the demo key', () => {
    store().createTask({
      title: 'Persisted demo task',
      description: '',
      category: 'documentation',
      priority: 'normal',
      status: 'open',
      assigneeId: null,
      caseLabel: null,
      dueAt: null,
    })
    const raw = window.localStorage.getItem('shiftsignal.demo.v1')
    expect(raw).toBeTruthy()
    expect(raw).toContain('Persisted demo task')
  })
})
