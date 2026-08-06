import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type {
  ActivityEvent,
  Checklist,
  ChecklistStep,
  DemoState,
  HandoffRecord,
  HandoffSections,
  ID,
  Task,
  TaskDraft,
  TaskStatus,
  TemplateStep,
  WorkflowTemplate,
} from '@/types/domain'
import { buildSeedState, SCHEMA_VERSION } from '@/data/seed'
import { createId } from '@/lib/id'
import { nowIso } from '@/lib/time'
import { STATUS_LABELS } from '@/lib/labels'

export const STORAGE_KEY = 'shiftsignal.demo.v1'

/** Keeps the persisted payload from growing without bound. */
const ACTIVITY_LIMIT = 300

export interface DemoActions {
  /* tasks */
  createTask: (draft: TaskDraft) => Task
  updateTask: (id: ID, patch: Partial<TaskDraft>) => void
  setTaskStatus: (id: ID, status: TaskStatus) => void
  addTaskNote: (id: ID, body: string) => void
  deleteTask: (id: ID) => void

  /* handoffs */
  createHandoff: (input: {
    title: string
    fromMemberId: ID
    toMemberId: ID | null
    caseLabel: string | null
  }) => HandoffRecord
  updateHandoffSections: (id: ID, sections: Partial<HandoffSections>) => void
  updateHandoffMeta: (
    id: ID,
    patch: Partial<Pick<HandoffRecord, 'title' | 'toMemberId' | 'caseLabel'>>,
  ) => void
  toggleHandoffTask: (id: ID, taskId: ID) => void
  setHandoffReady: (id: ID, ready: boolean) => void
  markHandedOff: (id: ID) => void
  deleteHandoff: (id: ID) => void

  /* checklists */
  createChecklistFromTemplate: (
    templateId: ID,
    input: { title: string; caseLabel: string | null },
  ) => Checklist | null
  toggleChecklistStep: (checklistId: ID, stepId: ID) => void
  updateChecklistStep: (
    checklistId: ID,
    stepId: ID,
    patch: Partial<Pick<ChecklistStep, 'assigneeId' | 'note'>>,
  ) => void
  archiveChecklist: (id: ID) => void
  deleteChecklist: (id: ID) => void

  /* templates */
  duplicateTemplate: (id: ID) => WorkflowTemplate | null
  updateTemplateMeta: (
    id: ID,
    patch: Partial<Pick<WorkflowTemplate, 'name' | 'description' | 'kind'>>,
  ) => void
  addTemplateStep: (id: ID, label: string) => void
  updateTemplateStep: (
    templateId: ID,
    stepId: ID,
    patch: Partial<Pick<TemplateStep, 'label' | 'hint' | 'enabled' | 'suggestedRole'>>,
  ) => void
  removeTemplateStep: (templateId: ID, stepId: ID) => void
  moveTemplateStep: (templateId: ID, stepId: ID, direction: -1 | 1) => void
  deleteTemplate: (id: ID) => void

  /* demo controls */
  setActiveShift: (id: ID) => void
  setCurrentUser: (id: ID) => void
  resetDemoData: () => void
}

export type DemoStore = DemoState & DemoActions

type Mutator = (state: DemoState) => Partial<DemoState>

function memberName(state: DemoState, id: ID | null): string {
  if (!id) return 'Unassigned'
  return state.members.find((m) => m.id === id)?.name ?? 'Unknown member'
}

function makeEvent(
  state: DemoState,
  event: Omit<ActivityEvent, 'id' | 'at' | 'actorId' | 'detail'> & {
    actorId?: ID | null
    detail?: string | null
  },
): ActivityEvent {
  return {
    id: createId('a'),
    at: nowIso(),
    actorId: event.actorId !== undefined ? event.actorId : state.currentUserId,
    kind: event.kind,
    entity: event.entity,
    entityId: event.entityId,
    summary: event.summary,
    detail: event.detail ?? null,
  }
}

function withActivity(state: DemoState, events: ActivityEvent[]): ActivityEvent[] {
  return [...events, ...state.activity].slice(0, ACTIVITY_LIMIT)
}

const emptySections = (): HandoffSections => ({
  situation: '',
  background: '',
  outstandingTasks: '',
  communicationCompleted: '',
  followUpNeeded: '',
  questions: '',
})

function checklistProgressStatus(steps: ChecklistStep[]): {
  status: Checklist['status']
  completedAt: string | null
} {
  const allComplete = steps.length > 0 && steps.every((s) => s.complete)
  if (!allComplete) return { status: 'active', completedAt: null }
  const last = steps
    .map((s) => s.completedAt)
    .filter((v): v is string => Boolean(v))
    .sort()
    .at(-1)
  return { status: 'complete', completedAt: last ?? nowIso() }
}

const dataKeys = [
  'schemaVersion',
  'currentUserId',
  'activeShiftId',
  'members',
  'shifts',
  'tasks',
  'handoffs',
  'templates',
  'checklists',
  'activity',
] as const

export const useDemoStore = create<DemoStore>()(
  persist(
    (set, get) => {
      /** Applies a mutator against the current data slice. */
      const mutate = (fn: Mutator) => set((state) => fn(state))

      return {
        ...buildSeedState(),

        /* ---------------------------------------------------------- tasks */

        createTask: (draft) => {
          const timestamp = nowIso()
          const task: Task = {
            id: createId('t'),
            title: draft.title.trim(),
            description: draft.description.trim(),
            category: draft.category,
            priority: draft.priority,
            status: draft.status,
            assigneeId: draft.assigneeId,
            shiftId: get().activeShiftId,
            caseLabel: draft.caseLabel,
            dueAt: draft.dueAt,
            createdAt: timestamp,
            updatedAt: timestamp,
            completedAt: draft.status === 'complete' ? timestamp : null,
            notes: [],
          }

          mutate((state) => ({
            tasks: [task, ...state.tasks],
            activity: withActivity(state, [
              makeEvent(state, {
                kind: 'created',
                entity: 'task',
                entityId: task.id,
                summary: `Created "${task.title}"`,
                detail: task.assigneeId ? `assigned to ${memberName(state, task.assigneeId)}` : null,
              }),
            ]),
          }))

          return task
        },

        updateTask: (id, patch) =>
          mutate((state) => {
            const existing = state.tasks.find((t) => t.id === id)
            if (!existing) return {}

            const timestamp = nowIso()
            const nextStatus = patch.status ?? existing.status
            const statusChanged = nextStatus !== existing.status
            const assigneeChanged =
              patch.assigneeId !== undefined && patch.assigneeId !== existing.assigneeId

            const updated: Task = {
              ...existing,
              ...patch,
              title: patch.title !== undefined ? patch.title.trim() : existing.title,
              description:
                patch.description !== undefined ? patch.description.trim() : existing.description,
              updatedAt: timestamp,
              completedAt:
                nextStatus === 'complete'
                  ? (existing.completedAt ?? timestamp)
                  : null,
            }

            const events: ActivityEvent[] = []
            if (statusChanged) {
              events.push(
                makeEvent(state, {
                  kind: nextStatus === 'complete' ? 'completed' : 'status-changed',
                  entity: 'task',
                  entityId: id,
                  summary:
                    nextStatus === 'complete'
                      ? `Completed "${updated.title}"`
                      : `Moved "${updated.title}" to ${STATUS_LABELS[nextStatus]}`,
                  detail:
                    nextStatus === 'complete'
                      ? null
                      : `${STATUS_LABELS[existing.status]} → ${STATUS_LABELS[nextStatus]}`,
                }),
              )
            }
            if (assigneeChanged) {
              events.push(
                makeEvent(state, {
                  kind: 'assigned',
                  entity: 'task',
                  entityId: id,
                  summary: `Assigned "${updated.title}"`,
                  detail: `to ${memberName(state, updated.assigneeId)}`,
                }),
              )
            }
            if (events.length === 0) {
              events.push(
                makeEvent(state, {
                  kind: 'updated',
                  entity: 'task',
                  entityId: id,
                  summary: `Updated "${updated.title}"`,
                }),
              )
            }

            return {
              tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
              activity: withActivity(state, events),
            }
          }),

        setTaskStatus: (id, status) =>
          mutate((state) => {
            const existing = state.tasks.find((t) => t.id === id)
            if (!existing || existing.status === status) return {}
            const timestamp = nowIso()
            const reopened = existing.status === 'complete' && status !== 'complete'

            const updated: Task = {
              ...existing,
              status,
              updatedAt: timestamp,
              completedAt: status === 'complete' ? timestamp : null,
            }

            return {
              tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind:
                    status === 'complete' ? 'completed' : reopened ? 'reopened' : 'status-changed',
                  entity: 'task',
                  entityId: id,
                  summary:
                    status === 'complete'
                      ? `Completed "${existing.title}"`
                      : reopened
                        ? `Reopened "${existing.title}"`
                        : `Moved "${existing.title}" to ${STATUS_LABELS[status]}`,
                  detail: `${STATUS_LABELS[existing.status]} → ${STATUS_LABELS[status]}`,
                }),
              ]),
            }
          }),

        addTaskNote: (id, body) =>
          mutate((state) => {
            const trimmed = body.trim()
            const existing = state.tasks.find((t) => t.id === id)
            if (!existing || !trimmed) return {}
            const timestamp = nowIso()

            const updated: Task = {
              ...existing,
              notes: [
                ...existing.notes,
                {
                  id: createId('n'),
                  authorId: state.currentUserId,
                  body: trimmed,
                  createdAt: timestamp,
                },
              ],
              updatedAt: timestamp,
            }

            return {
              tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: 'note-added',
                  entity: 'task',
                  entityId: id,
                  summary: `Added a note to "${existing.title}"`,
                }),
              ]),
            }
          }),

        deleteTask: (id) =>
          mutate((state) => {
            const existing = state.tasks.find((t) => t.id === id)
            if (!existing) return {}
            return {
              tasks: state.tasks.filter((t) => t.id !== id),
              handoffs: state.handoffs.map((h) =>
                h.linkedTaskIds.includes(id)
                  ? { ...h, linkedTaskIds: h.linkedTaskIds.filter((tid) => tid !== id) }
                  : h,
              ),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: 'deleted',
                  entity: 'task',
                  entityId: id,
                  summary: `Deleted "${existing.title}"`,
                }),
              ]),
            }
          }),

        /* ------------------------------------------------------- handoffs */

        createHandoff: (input) => {
          const timestamp = nowIso()
          const record: HandoffRecord = {
            id: createId('h'),
            title: input.title.trim() || 'Untitled handoff',
            shiftId: get().activeShiftId,
            fromMemberId: input.fromMemberId,
            toMemberId: input.toMemberId,
            status: 'draft',
            caseLabel: input.caseLabel,
            sections: emptySections(),
            linkedTaskIds: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            handedOffAt: null,
          }

          mutate((state) => ({
            handoffs: [record, ...state.handoffs],
            activity: withActivity(state, [
              makeEvent(state, {
                kind: 'created',
                entity: 'handoff',
                entityId: record.id,
                summary: `Started the handoff draft "${record.title}"`,
              }),
            ]),
          }))

          return record
        },

        updateHandoffSections: (id, sections) =>
          mutate((state) => {
            const existing = state.handoffs.find((h) => h.id === id)
            if (!existing) return {}
            return {
              handoffs: state.handoffs.map((h) =>
                h.id === id
                  ? { ...h, sections: { ...h.sections, ...sections }, updatedAt: nowIso() }
                  : h,
              ),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: 'updated',
                  entity: 'handoff',
                  entityId: id,
                  summary: `Saved changes to "${existing.title}"`,
                }),
              ]),
            }
          }),

        updateHandoffMeta: (id, patch) =>
          mutate((state) => {
            const existing = state.handoffs.find((h) => h.id === id)
            if (!existing) return {}
            return {
              handoffs: state.handoffs.map((h) =>
                h.id === id
                  ? {
                      ...h,
                      ...patch,
                      title: patch.title !== undefined ? patch.title.trim() || h.title : h.title,
                      updatedAt: nowIso(),
                    }
                  : h,
              ),
            }
          }),

        toggleHandoffTask: (id, taskId) =>
          mutate((state) => ({
            handoffs: state.handoffs.map((h) => {
              if (h.id !== id) return h
              const linked = h.linkedTaskIds.includes(taskId)
              return {
                ...h,
                linkedTaskIds: linked
                  ? h.linkedTaskIds.filter((t) => t !== taskId)
                  : [...h.linkedTaskIds, taskId],
                updatedAt: nowIso(),
              }
            }),
          })),

        setHandoffReady: (id, ready) =>
          mutate((state) => {
            const existing = state.handoffs.find((h) => h.id === id)
            if (!existing || existing.status === 'handed-off') return {}
            const status: HandoffRecord['status'] = ready ? 'ready' : 'draft'
            if (status === existing.status) return {}
            return {
              handoffs: state.handoffs.map((h) =>
                h.id === id ? { ...h, status, updatedAt: nowIso() } : h,
              ),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: 'status-changed',
                  entity: 'handoff',
                  entityId: id,
                  summary: ready
                    ? `Marked "${existing.title}" ready to hand off`
                    : `Returned "${existing.title}" to draft`,
                }),
              ]),
            }
          }),

        markHandedOff: (id) =>
          mutate((state) => {
            const existing = state.handoffs.find((h) => h.id === id)
            if (!existing || existing.status === 'handed-off') return {}
            const timestamp = nowIso()
            return {
              handoffs: state.handoffs.map((h) =>
                h.id === id
                  ? { ...h, status: 'handed-off', handedOffAt: timestamp, updatedAt: timestamp }
                  : h,
              ),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: 'handed-off',
                  entity: 'handoff',
                  entityId: id,
                  summary: `Marked "${existing.title}" as handed off`,
                  detail: existing.toMemberId ? `to ${memberName(state, existing.toMemberId)}` : null,
                }),
              ]),
            }
          }),

        deleteHandoff: (id) =>
          mutate((state) => {
            const existing = state.handoffs.find((h) => h.id === id)
            if (!existing) return {}
            return {
              handoffs: state.handoffs.filter((h) => h.id !== id),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: 'deleted',
                  entity: 'handoff',
                  entityId: id,
                  summary: `Deleted the handoff "${existing.title}"`,
                }),
              ]),
            }
          }),

        /* ----------------------------------------------------- checklists */

        createChecklistFromTemplate: (templateId, input) => {
          const state = get()
          const template = state.templates.find((t) => t.id === templateId)
          if (!template) return null

          const timestamp = nowIso()
          const checklist: Checklist = {
            id: createId('cl'),
            title: input.title.trim() || template.name,
            templateId: template.id,
            templateName: template.name,
            kind: template.kind,
            shiftId: state.activeShiftId,
            caseLabel: input.caseLabel,
            status: 'active',
            steps: template.steps
              .filter((step) => step.enabled)
              .map((step) => ({
                id: createId('cs'),
                label: step.label,
                hint: step.hint,
                complete: false,
                assigneeId: null,
                note: '',
                completedAt: null,
              })),
            createdAt: timestamp,
            updatedAt: timestamp,
            completedAt: null,
          }

          mutate((s) => ({
            checklists: [checklist, ...s.checklists],
            activity: withActivity(s, [
              makeEvent(s, {
                kind: 'created',
                entity: 'checklist',
                entityId: checklist.id,
                summary: `Started the checklist "${checklist.title}"`,
                detail: `from ${template.name}`,
              }),
            ]),
          }))

          return checklist
        },

        toggleChecklistStep: (checklistId, stepId) =>
          mutate((state) => {
            const checklist = state.checklists.find((c) => c.id === checklistId)
            if (!checklist) return {}
            const step = checklist.steps.find((s) => s.id === stepId)
            if (!step) return {}

            const timestamp = nowIso()
            const nextComplete = !step.complete
            const steps = checklist.steps.map((s) =>
              s.id === stepId
                ? { ...s, complete: nextComplete, completedAt: nextComplete ? timestamp : null }
                : s,
            )
            const { status, completedAt } = checklistProgressStatus(steps)

            return {
              checklists: state.checklists.map((c) =>
                c.id === checklistId
                  ? { ...c, steps, status, completedAt, updatedAt: timestamp }
                  : c,
              ),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: nextComplete ? 'step-completed' : 'step-reopened',
                  entity: 'checklist',
                  entityId: checklistId,
                  summary: nextComplete
                    ? `Completed a step on "${checklist.title}"`
                    : `Reopened a step on "${checklist.title}"`,
                  detail: step.label,
                }),
              ]),
            }
          }),

        updateChecklistStep: (checklistId, stepId, patch) =>
          mutate((state) => ({
            checklists: state.checklists.map((c) =>
              c.id === checklistId
                ? {
                    ...c,
                    steps: c.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
                    updatedAt: nowIso(),
                  }
                : c,
            ),
          })),

        archiveChecklist: (id) =>
          mutate((state) => {
            const existing = state.checklists.find((c) => c.id === id)
            if (!existing) return {}
            return {
              checklists: state.checklists.map((c) =>
                c.id === id ? { ...c, status: 'archived', updatedAt: nowIso() } : c,
              ),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: 'updated',
                  entity: 'checklist',
                  entityId: id,
                  summary: `Archived the checklist "${existing.title}"`,
                }),
              ]),
            }
          }),

        deleteChecklist: (id) =>
          mutate((state) => {
            const existing = state.checklists.find((c) => c.id === id)
            if (!existing) return {}
            return {
              checklists: state.checklists.filter((c) => c.id !== id),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: 'deleted',
                  entity: 'checklist',
                  entityId: id,
                  summary: `Deleted the checklist "${existing.title}"`,
                }),
              ]),
            }
          }),

        /* ------------------------------------------------------ templates */

        duplicateTemplate: (id) => {
          const state = get()
          const source = state.templates.find((t) => t.id === id)
          if (!source) return null

          const timestamp = nowIso()
          const newId = createId('tpl')
          const copy: WorkflowTemplate = {
            ...source,
            id: newId,
            name: `${source.name} (copy)`,
            isSeeded: false,
            steps: source.steps.map((step) => ({ ...step, id: createId('ts') })),
            createdAt: timestamp,
            updatedAt: timestamp,
          }

          mutate((s) => ({
            templates: [copy, ...s.templates],
            activity: withActivity(s, [
              makeEvent(s, {
                kind: 'duplicated',
                entity: 'template',
                entityId: copy.id,
                summary: `Duplicated the template "${source.name}"`,
              }),
            ]),
          }))

          return copy
        },

        updateTemplateMeta: (id, patch) =>
          mutate((state) => ({
            templates: state.templates.map((t) =>
              t.id === id
                ? {
                    ...t,
                    ...patch,
                    name: patch.name !== undefined ? patch.name.trim() || t.name : t.name,
                    updatedAt: nowIso(),
                  }
                : t,
            ),
          })),

        addTemplateStep: (id, label) =>
          mutate((state) => {
            const trimmed = label.trim()
            if (!trimmed) return {}
            return {
              templates: state.templates.map((t) =>
                t.id === id
                  ? {
                      ...t,
                      steps: [
                        ...t.steps,
                        {
                          id: createId('ts'),
                          label: trimmed,
                          hint: '',
                          enabled: true,
                          suggestedRole: null,
                        },
                      ],
                      updatedAt: nowIso(),
                    }
                  : t,
              ),
            }
          }),

        updateTemplateStep: (templateId, stepId, patch) =>
          mutate((state) => ({
            templates: state.templates.map((t) =>
              t.id === templateId
                ? {
                    ...t,
                    steps: t.steps.map((s) => (s.id === stepId ? { ...s, ...patch } : s)),
                    updatedAt: nowIso(),
                  }
                : t,
            ),
          })),

        removeTemplateStep: (templateId, stepId) =>
          mutate((state) => ({
            templates: state.templates.map((t) =>
              t.id === templateId
                ? { ...t, steps: t.steps.filter((s) => s.id !== stepId), updatedAt: nowIso() }
                : t,
            ),
          })),

        moveTemplateStep: (templateId, stepId, direction) =>
          mutate((state) => ({
            templates: state.templates.map((t) => {
              if (t.id !== templateId) return t
              const index = t.steps.findIndex((s) => s.id === stepId)
              const target = index + direction
              if (index === -1 || target < 0 || target >= t.steps.length) return t
              const steps = [...t.steps]
              const [moved] = steps.splice(index, 1)
              steps.splice(target, 0, moved)
              return { ...t, steps, updatedAt: nowIso() }
            }),
          })),

        deleteTemplate: (id) =>
          mutate((state) => {
            const existing = state.templates.find((t) => t.id === id)
            if (!existing || existing.isSeeded) return {}
            return {
              templates: state.templates.filter((t) => t.id !== id),
              activity: withActivity(state, [
                makeEvent(state, {
                  kind: 'deleted',
                  entity: 'template',
                  entityId: id,
                  summary: `Deleted the template "${existing.name}"`,
                }),
              ]),
            }
          }),

        /* --------------------------------------------------------- demo */

        setActiveShift: (id) => set({ activeShiftId: id }),

        setCurrentUser: (id) => set({ currentUserId: id }),

        resetDemoData: () => {
          const fresh = buildSeedState()
          set({
            ...fresh,
            activity: [
              {
                id: createId('a'),
                at: nowIso(),
                kind: 'reset',
                entity: 'demo',
                entityId: 'demo',
                summary: 'Demo data was reset to the seeded dataset',
                actorId: fresh.currentUserId,
                detail: null,
              },
              ...fresh.activity,
            ],
          })
        },
      }
    },
    {
      name: STORAGE_KEY,
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(([key]) => (dataKeys as readonly string[]).includes(key)),
        ) as DemoState,
      migrate: () => buildSeedState(),
    },
  ),
)
