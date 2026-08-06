import type {
  ChecklistStatus,
  HandoffSectionKey,
  HandoffStatus,
  ShiftStatus,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  WorkflowKind,
} from '@/types/domain'

/** Semantic tone names consumed by `<Badge tone="...">`. */
export type Tone = 'neutral' | 'info' | 'progress' | 'warn' | 'accent' | 'success'

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  administrative: 'Administrative',
  communication: 'Communication',
  coordination: 'Coordination',
  documentation: 'Documentation',
  'follow-up': 'Follow-up',
  equipment: 'Equipment',
  education: 'Education',
}

export const CATEGORY_DESCRIPTIONS: Record<TaskCategory, string> = {
  administrative: 'Unit paperwork, scheduling, and record-keeping steps.',
  communication: 'Calls, pages, and messages that need to be placed or returned.',
  coordination: 'Cross-department logistics such as transport or bed placement.',
  documentation: 'Forms and workflow records that still need to be completed.',
  'follow-up': 'Items that must be revisited before the shift closes.',
  equipment: 'Device tracking, returns, and room readiness.',
  education: 'Competency, orientation, and in-service items.',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

export const PRIORITY_TONES: Record<TaskPriority, Tone> = {
  low: 'neutral',
  normal: 'info',
  high: 'warn',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  open: 'Open',
  'in-progress': 'In progress',
  blocked: 'Blocked',
  'awaiting-handoff': 'Awaiting handoff',
  complete: 'Complete',
}

export const STATUS_TONES: Record<TaskStatus, Tone> = {
  open: 'neutral',
  'in-progress': 'progress',
  blocked: 'warn',
  'awaiting-handoff': 'accent',
  complete: 'success',
}

/** Column order for the task board. */
export const BOARD_COLUMNS: TaskStatus[] = [
  'open',
  'in-progress',
  'blocked',
  'awaiting-handoff',
  'complete',
]

export const WORKFLOW_LABELS: Record<WorkflowKind, string> = {
  admission: 'Admission workflow',
  transfer: 'Transfer workflow',
  discharge: 'Discharge coordination',
  'shift-change': 'Shift-change preparation',
  equipment: 'Equipment handoff',
  'follow-up': 'Follow-up communication',
}

export const CHECKLIST_STATUS_LABELS: Record<ChecklistStatus, string> = {
  active: 'Active',
  complete: 'Complete',
  archived: 'Archived',
}

export const CHECKLIST_STATUS_TONES: Record<ChecklistStatus, Tone> = {
  active: 'progress',
  complete: 'success',
  archived: 'neutral',
}

export const HANDOFF_STATUS_LABELS: Record<HandoffStatus, string> = {
  draft: 'Draft',
  ready: 'Ready to hand off',
  'handed-off': 'Handed off',
}

export const HANDOFF_STATUS_TONES: Record<HandoffStatus, Tone> = {
  draft: 'neutral',
  ready: 'accent',
  'handed-off': 'success',
}

export const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  archived: 'Archived',
}

export const SHIFT_STATUS_TONES: Record<ShiftStatus, Tone> = {
  active: 'success',
  upcoming: 'info',
  archived: 'neutral',
}

export interface HandoffSectionMeta {
  key: HandoffSectionKey
  label: string
  helper: string
  placeholder: string
  /** Sections required before a handoff can be marked ready. */
  required: boolean
}

export const HANDOFF_SECTIONS: HandoffSectionMeta[] = [
  {
    key: 'situation',
    label: 'Situation',
    helper: 'Where the workflow stands right now, in operational terms.',
    placeholder:
      'Example: Demo Case A is waiting on transport scheduling; everything else on the assignment is current.',
    required: true,
  },
  {
    key: 'background',
    label: 'Background',
    helper: 'Administrative context the next shift needs to pick this up.',
    placeholder:
      'Example: Transport request was submitted at 14:10 and the confirmation number is still pending.',
    required: true,
  },
  {
    key: 'outstandingTasks',
    label: 'Outstanding administrative tasks',
    helper: 'Work items that are still open. Link tasks below to pull them in automatically.',
    placeholder: 'Example: Equipment return log still needs a signature from the receiving unit.',
    required: true,
  },
  {
    key: 'communicationCompleted',
    label: 'Communication completed',
    helper: 'Calls, pages, and messages already placed so they are not duplicated.',
    placeholder: 'Example: Called the coordination desk at 15:30 and confirmed the paperwork packet.',
    required: false,
  },
  {
    key: 'followUpNeeded',
    label: 'Follow-up needed',
    helper: 'What the incoming team should revisit and roughly when.',
    placeholder: 'Example: Re-check the transport queue after 20:00 if no confirmation arrives.',
    required: false,
  },
  {
    key: 'questions',
    label: 'Questions for next shift',
    helper: 'Open questions to resolve during the verbal handoff conversation.',
    placeholder: 'Example: Does the receiving unit want the equipment log emailed or delivered?',
    required: false,
  },
]

export const HANDOFF_SECTION_LABELS: Record<HandoffSectionKey, string> = HANDOFF_SECTIONS.reduce(
  (acc, section) => {
    acc[section.key] = section.label
    return acc
  },
  {} as Record<HandoffSectionKey, string>,
)

/** Non-identifying labels used everywhere a real product would show a patient. */
export const CASE_LABELS = [
  'Demo Case A',
  'Demo Case B',
  'Demo Case C',
  'Demo Case D',
  'Demo Case E',
  'Demo Case F',
] as const
