/**
 * ShiftSignal domain model.
 *
 * IMPORTANT: every entity in this file describes *administrative and operational*
 * workflow only. There are deliberately no fields for diagnoses, medications,
 * vitals, acuity scores, clinical severity, or patient identifiers. "Case labels"
 * are opaque demo strings such as "Demo Case A".
 */

export type ID = string

/** ISO-8601 timestamp string. */
export type ISODateTime = string

/* ------------------------------------------------------------------ *
 * People & shifts
 * ------------------------------------------------------------------ */

export const TEAM_ROLES = [
  'Charge Nurse',
  'Registered Nurse',
  'Care Coordinator',
  'Unit Clerk',
  'Patient Care Technician',
  'Nurse Educator',
] as const

export type TeamRole = (typeof TEAM_ROLES)[number]

export interface TeamMember {
  id: ID
  name: string
  initials: string
  role: TeamRole
  /** Free-text operational focus, e.g. "Discharge coordination". */
  focus: string
  /** Index 0-5 into the avatar accent palette. */
  accent: number
}

export type ShiftStatus = 'active' | 'upcoming' | 'archived'

export interface Shift {
  id: ID
  label: string
  unit: string
  status: ShiftStatus
  startsAt: ISODateTime
  endsAt: ISODateTime
  chargeMemberId: ID
  memberIds: ID[]
}

/* ------------------------------------------------------------------ *
 * Tasks
 * ------------------------------------------------------------------ */

export const TASK_CATEGORIES = [
  'administrative',
  'communication',
  'coordination',
  'documentation',
  'follow-up',
  'equipment',
  'education',
] as const

export type TaskCategory = (typeof TASK_CATEGORIES)[number]

/**
 * Priority is an *organizational* label chosen by the user. It is never derived
 * from clinical data and carries no medical meaning.
 */
export const TASK_PRIORITIES = ['low', 'normal', 'high'] as const
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const TASK_STATUSES = [
  'open',
  'in-progress',
  'blocked',
  'awaiting-handoff',
  'complete',
] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]

export interface TaskNote {
  id: ID
  authorId: ID | null
  body: string
  createdAt: ISODateTime
}

export interface Task {
  id: ID
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  assigneeId: ID | null
  shiftId: ID
  /** Opaque non-identifying demo label, e.g. "Demo Case A". */
  caseLabel: string | null
  dueAt: ISODateTime | null
  createdAt: ISODateTime
  updatedAt: ISODateTime
  completedAt: ISODateTime | null
  notes: TaskNote[]
}

export type TaskDraft = Pick<
  Task,
  | 'title'
  | 'description'
  | 'category'
  | 'priority'
  | 'status'
  | 'assigneeId'
  | 'caseLabel'
  | 'dueAt'
>

/* ------------------------------------------------------------------ *
 * Handoffs
 * ------------------------------------------------------------------ */

export const HANDOFF_SECTION_KEYS = [
  'situation',
  'background',
  'outstandingTasks',
  'communicationCompleted',
  'followUpNeeded',
  'questions',
] as const

export type HandoffSectionKey = (typeof HANDOFF_SECTION_KEYS)[number]

export type HandoffSections = Record<HandoffSectionKey, string>

export type HandoffStatus = 'draft' | 'ready' | 'handed-off'

export interface HandoffRecord {
  id: ID
  title: string
  shiftId: ID
  fromMemberId: ID
  toMemberId: ID | null
  status: HandoffStatus
  caseLabel: string | null
  sections: HandoffSections
  /** Tasks explicitly attached to the handoff packet. */
  linkedTaskIds: ID[]
  createdAt: ISODateTime
  updatedAt: ISODateTime
  handedOffAt: ISODateTime | null
}

/* ------------------------------------------------------------------ *
 * Workflow templates & checklists
 * ------------------------------------------------------------------ */

export const WORKFLOW_KINDS = [
  'admission',
  'transfer',
  'discharge',
  'shift-change',
  'equipment',
  'follow-up',
] as const

export type WorkflowKind = (typeof WORKFLOW_KINDS)[number]

export interface TemplateStep {
  id: ID
  label: string
  hint: string
  enabled: boolean
  /** Suggested owning role; purely a coordination hint. */
  suggestedRole: TeamRole | null
}

export interface WorkflowTemplate {
  id: ID
  name: string
  description: string
  kind: WorkflowKind
  steps: TemplateStep[]
  /** Seeded templates are marked so the UI can label them and guard deletion. */
  isSeeded: boolean
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface ChecklistStep {
  id: ID
  label: string
  hint: string
  complete: boolean
  assigneeId: ID | null
  note: string
  completedAt: ISODateTime | null
}

export type ChecklistStatus = 'active' | 'complete' | 'archived'

export interface Checklist {
  id: ID
  title: string
  templateId: ID | null
  templateName: string
  kind: WorkflowKind
  shiftId: ID
  caseLabel: string | null
  status: ChecklistStatus
  steps: ChecklistStep[]
  createdAt: ISODateTime
  updatedAt: ISODateTime
  completedAt: ISODateTime | null
}

/* ------------------------------------------------------------------ *
 * Activity log
 * ------------------------------------------------------------------ */

export type ActivityEntity = 'task' | 'handoff' | 'checklist' | 'template' | 'demo'

export type ActivityKind =
  | 'created'
  | 'updated'
  | 'status-changed'
  | 'assigned'
  | 'completed'
  | 'reopened'
  | 'note-added'
  | 'step-completed'
  | 'step-reopened'
  | 'handed-off'
  | 'duplicated'
  | 'deleted'
  | 'reset'

export interface ActivityEvent {
  id: ID
  at: ISODateTime
  kind: ActivityKind
  entity: ActivityEntity
  entityId: ID
  /** Human-readable one-line summary rendered in the activity feed. */
  summary: string
  actorId: ID | null
  /** Optional short detail, e.g. "open -> in-progress". */
  detail: string | null
}

/* ------------------------------------------------------------------ *
 * Root persisted state
 * ------------------------------------------------------------------ */

export interface DemoState {
  schemaVersion: number
  currentUserId: ID
  activeShiftId: ID
  members: TeamMember[]
  shifts: Shift[]
  tasks: Task[]
  handoffs: HandoffRecord[]
  templates: WorkflowTemplate[]
  checklists: Checklist[]
  activity: ActivityEvent[]
}
