/**
 * Fictional demo data for ShiftSignal.
 *
 * Everything here is invented for a portfolio demonstration. There are no real
 * people, no real facilities, and no protected health information. Cases are
 * referred to only by opaque labels such as "Demo Case A", and every task,
 * checklist step, and handoff note describes administrative coordination work.
 */

import type {
  ActivityEvent,
  Checklist,
  ChecklistStep,
  DemoState,
  HandoffRecord,
  HandoffSections,
  Shift,
  Task,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  TeamMember,
  TemplateStep,
  WorkflowKind,
  WorkflowTemplate,
} from '@/types/domain'
import { addDays, addHours, addMinutes, atHour } from '@/lib/time'

export const SCHEMA_VERSION = 1

export const CURRENT_USER_ID = 'm-samuel'
export const ACTIVE_SHIFT_ID = 's-day'

const iso = (d: Date) => d.toISOString()

/* ------------------------------------------------------------------ *
 * Team
 * ------------------------------------------------------------------ */

const MEMBERS: TeamMember[] = [
  {
    id: 'm-samuel',
    name: 'Samuel Garcia',
    initials: 'SG',
    role: 'Charge Nurse',
    focus: 'Shift coordination and handoff',
    accent: 0,
  },
  {
    id: 'm-renee',
    name: 'Renee Alcantara',
    initials: 'RA',
    role: 'Registered Nurse',
    focus: 'Admission workflow',
    accent: 1,
  },
  {
    id: 'm-devon',
    name: 'Devon Whitfield',
    initials: 'DW',
    role: 'Care Coordinator',
    focus: 'Discharge coordination',
    accent: 2,
  },
  {
    id: 'm-priya',
    name: 'Priya Raman',
    initials: 'PR',
    role: 'Registered Nurse',
    focus: 'Transfer logistics',
    accent: 3,
  },
  {
    id: 'm-marcus',
    name: 'Marcus Oyelaran',
    initials: 'MO',
    role: 'Unit Clerk',
    focus: 'Chart assembly and intake queue',
    accent: 4,
  },
  {
    id: 'm-tasha',
    name: 'Tasha Brennan',
    initials: 'TB',
    role: 'Patient Care Technician',
    focus: 'Equipment tracking and room turnover',
    accent: 5,
  },
  {
    id: 'm-joyce',
    name: 'Joyce Lin',
    initials: 'JL',
    role: 'Nurse Educator',
    focus: 'Competency and orientation records',
    accent: 1,
  },
]

/* ------------------------------------------------------------------ *
 * Workflow templates
 * ------------------------------------------------------------------ */

interface StepSeed {
  label: string
  hint: string
  role?: TemplateStep['suggestedRole']
  disabled?: boolean
}

function buildSteps(templateId: string, seeds: StepSeed[]): TemplateStep[] {
  return seeds.map((seed, index) => ({
    id: `${templateId}-s${index + 1}`,
    label: seed.label,
    hint: seed.hint,
    enabled: seed.disabled !== true,
    suggestedRole: seed.role ?? null,
  }))
}

interface TemplateSeed {
  id: string
  name: string
  description: string
  kind: WorkflowKind
  steps: StepSeed[]
}

const TEMPLATE_SEEDS: TemplateSeed[] = [
  {
    id: 'tpl-admission',
    name: 'Admission workflow',
    description:
      'Administrative steps the unit completes when a new assignment arrives, from intake acknowledgement through chart assembly.',
    kind: 'admission',
    steps: [
      {
        label: 'Acknowledge the arrival notification in the intake queue',
        hint: 'Confirms the unit has seen the entry so admitting stops paging.',
        role: 'Unit Clerk',
      },
      {
        label: 'Assign a room and update the unit assignment board',
        hint: 'Keeps the shared board accurate for everyone on the floor.',
        role: 'Charge Nurse',
      },
      {
        label: 'Verify the demographic and contact information form is complete',
        hint: 'Missing contact details are the most common rework driver.',
        role: 'Unit Clerk',
      },
      {
        label: 'Collect signed consent-to-treat and privacy acknowledgement forms',
        hint: 'Filed with unit administration, not stored in this tool.',
        role: 'Registered Nurse',
      },
      {
        label: 'Assemble the paper chart insert packet',
        hint: 'Standard packet contents are defined by unit policy.',
        role: 'Unit Clerk',
      },
      {
        label: 'Notify assigned team members of the new assignment',
        hint: 'A single announcement avoids duplicate calls.',
        role: 'Charge Nurse',
      },
      {
        label: 'Record the admission workflow completion time in the shift log',
        hint: 'Used for unit throughput reporting.',
        role: 'Charge Nurse',
      },
    ],
  },
  {
    id: 'tpl-transfer',
    name: 'Transfer workflow',
    description:
      'Coordination checklist for moving an assignment between units, covering paperwork, transport, and equipment reconciliation.',
    kind: 'transfer',
    steps: [
      {
        label: 'Confirm the receiving unit and the accepting contact person',
        hint: 'Record who accepted so follow-up calls reach the right desk.',
        role: 'Charge Nurse',
      },
      {
        label: 'Verify the transfer paperwork packet is assembled',
        hint: 'Packet contents follow the institutional transfer policy.',
        role: 'Unit Clerk',
      },
      {
        label: 'Schedule transport with the coordination desk',
        hint: 'Capture the confirmation number when it is issued.',
        role: 'Care Coordinator',
      },
      {
        label: 'Reconcile the equipment inventory leaving with the case',
        hint: 'Prevents devices from going missing between units.',
        role: 'Patient Care Technician',
      },
      {
        label: 'Send the written handoff summary to the receiving unit',
        hint: 'Use the structured handoff builder to draft it.',
        role: 'Registered Nurse',
      },
      {
        label: 'Update the unit assignment board after departure',
        hint: 'Closes the loop so the room can be turned over.',
        role: 'Charge Nurse',
      },
    ],
  },
  {
    id: 'tpl-discharge',
    name: 'Discharge coordination',
    description:
      'The administrative side of a discharge: packet assembly, transportation logistics, equipment returns, and follow-up scheduling.',
    kind: 'discharge',
    steps: [
      {
        label: 'Open the discharge workflow entry in the unit log',
        hint: 'Starts the coordination clock for reporting.',
        role: 'Unit Clerk',
      },
      {
        label: 'Verify the discharge instruction packet is assembled and printed',
        hint: 'Clerical assembly only. Content is authored by the care team.',
        role: 'Unit Clerk',
      },
      {
        label: 'Confirm transportation arrangements with the listed contact',
        hint: 'Note the pickup window so the room turnover can be sequenced.',
        role: 'Care Coordinator',
      },
      {
        label: 'Schedule the follow-up appointment reminder call',
        hint: 'Creates a follow-up task on the board automatically in a real build.',
        role: 'Care Coordinator',
      },
      {
        label: 'Reconcile borrowed equipment returns',
        hint: 'Cross-check against the equipment log before departure.',
        role: 'Patient Care Technician',
      },
      {
        label: 'Complete the discharge documentation checklist entries',
        hint: 'Confirms every required form has been filed.',
        role: 'Registered Nurse',
      },
      {
        label: 'Update room status for turnover',
        hint: 'Signals environmental services that the room is available.',
        role: 'Patient Care Technician',
      },
    ],
  },
  {
    id: 'tpl-shift-change',
    name: 'Shift-change preparation',
    description:
      'What the outgoing team does in the last hour so the incoming team starts with an accurate picture.',
    kind: 'shift-change',
    steps: [
      {
        label: 'Review every open task and refresh its status',
        hint: 'Stale statuses are the main cause of duplicated work.',
        role: 'Registered Nurse',
      },
      {
        label: 'Flag items that require handoff',
        hint: 'Move them to "Awaiting handoff" on the task board.',
        role: 'Registered Nurse',
      },
      {
        label: 'Draft the structured handoff record',
        hint: 'Use the handoff builder so nothing is left to memory.',
        role: 'Charge Nurse',
      },
      {
        label: 'Confirm incoming assignment coverage with the charge nurse',
        hint: 'Verifies every assignment has a named owner.',
        role: 'Charge Nurse',
      },
      {
        label: 'Verify all documentation checklists are current',
        hint: 'Partial checklists get flagged on the overview page.',
        role: 'Unit Clerk',
      },
      {
        label: 'Share the shift summary board with the incoming team',
        hint: 'Printed or displayed, per unit preference.',
        role: 'Charge Nurse',
        disabled: true,
      },
    ],
  },
  {
    id: 'tpl-equipment',
    name: 'Equipment handoff',
    description:
      'Device tracking steps used when equipment moves between units or returns to central supply.',
    kind: 'equipment',
    steps: [
      {
        label: 'Inventory the devices currently assigned to the unit',
        hint: 'Walk the rooms rather than trusting the last log entry.',
        role: 'Patient Care Technician',
      },
      {
        label: 'Record device identifiers in the equipment log',
        hint: 'Asset tag numbers only, no case details.',
        role: 'Patient Care Technician',
      },
      {
        label: 'Confirm the receiving department contact',
        hint: 'Central supply and biomedical engineering use different desks.',
        role: 'Unit Clerk',
      },
      {
        label: 'Obtain a signature on the transfer log',
        hint: 'The signature is what closes the chain of custody.',
        role: 'Patient Care Technician',
      },
      {
        label: 'File the completed log with unit administration',
        hint: 'Scanned copies go to the unit records queue.',
        role: 'Unit Clerk',
      },
    ],
  },
  {
    id: 'tpl-follow-up',
    name: 'Follow-up communication',
    description:
      'A repeatable loop for outbound follow-up calls so attempts are logged consistently.',
    kind: 'follow-up',
    steps: [
      {
        label: 'Confirm the preferred contact method on file',
        hint: 'Avoids wasted attempts on a disconnected number.',
        role: 'Care Coordinator',
      },
      {
        label: 'Place the scheduled follow-up call',
        hint: 'Administrative confirmation only, no clinical guidance given.',
        role: 'Care Coordinator',
      },
      {
        label: 'Document the outcome of the contact attempt',
        hint: 'Reached, left message, or unable to reach.',
        role: 'Care Coordinator',
      },
      {
        label: 'Schedule a second attempt if there was no answer',
        hint: 'Unit policy defines the retry window.',
        role: 'Care Coordinator',
      },
      {
        label: 'Close the follow-up item on the task board',
        hint: 'Keeps the open-task count trustworthy.',
        role: 'Registered Nurse',
      },
    ],
  },
]

/* ------------------------------------------------------------------ *
 * Tasks
 * ------------------------------------------------------------------ */

interface TaskSeed {
  id: string
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  assigneeId: string | null
  shiftId: string
  caseLabel?: string
  /** Hours from the shift anchor; negative values are already overdue. */
  dueOffsetHours: number | null
  createdOffsetHours: number
  completedOffsetHours?: number
  notes?: Array<{ authorId: string; body: string; offsetHours: number }>
}

const TASK_SEEDS: TaskSeed[] = [
  {
    id: 't-01',
    title: 'Confirm transport scheduling for Demo Case A',
    description:
      'Transport request was submitted this morning. Waiting on a confirmation number from the coordination desk before the assignment can be sequenced.',
    category: 'coordination',
    priority: 'high',
    status: 'in-progress',
    assigneeId: 'm-devon',
    shiftId: 's-day',
    caseLabel: 'Demo Case A',
    dueOffsetHours: 1,
    createdOffsetHours: -4,
    notes: [
      {
        authorId: 'm-devon',
        body: 'Called the coordination desk at the top of the hour. They are working a backlog and asked for a callback in 45 minutes.',
        offsetHours: -1,
      },
    ],
  },
  {
    id: 't-02',
    title: 'Complete admission workflow packet for Demo Case B',
    description:
      'Chart insert packet is partially assembled. Demographic form and privacy acknowledgement still need to be verified.',
    category: 'documentation',
    priority: 'normal',
    status: 'open',
    assigneeId: 'm-renee',
    shiftId: 's-day',
    caseLabel: 'Demo Case B',
    dueOffsetHours: 2,
    createdOffsetHours: -3,
  },
  {
    id: 't-03',
    title: 'Return telemetry box to biomedical engineering',
    description:
      'Asset tag is logged. Needs a signature from the receiving department before the log entry can be filed.',
    category: 'equipment',
    priority: 'normal',
    status: 'awaiting-handoff',
    assigneeId: 'm-tasha',
    shiftId: 's-day',
    caseLabel: 'Demo Case C',
    dueOffsetHours: -0.5,
    createdOffsetHours: -5,
  },
  {
    id: 't-04',
    title: 'Call coordination desk about pending bed assignment',
    description:
      'Bed placement request has not been acknowledged. Blocked until the placement desk reopens after their shift change.',
    category: 'communication',
    priority: 'high',
    status: 'blocked',
    assigneeId: 'm-priya',
    shiftId: 's-day',
    caseLabel: 'Demo Case D',
    dueOffsetHours: -0.75,
    createdOffsetHours: -4.5,
    notes: [
      {
        authorId: 'm-priya',
        body: 'Placement desk is between coverage until 16:00. Flagged so the next attempt is not duplicated.',
        offsetHours: -1.5,
      },
      {
        authorId: 'm-samuel',
        body: 'Adding this to the handoff packet in case it is still open at shift change.',
        offsetHours: -0.5,
      },
    ],
  },
  {
    id: 't-05',
    title: 'File signed consent-to-treat form copies',
    description: 'Copies scanned to the unit records queue and originals filed with administration.',
    category: 'administrative',
    priority: 'low',
    status: 'complete',
    assigneeId: 'm-marcus',
    shiftId: 's-day',
    dueOffsetHours: -2,
    createdOffsetHours: -6,
    completedOffsetHours: -2.25,
  },
  {
    id: 't-06',
    title: 'Update unit assignment board for evening coverage',
    description:
      'Evening coverage changed after the float assignment was confirmed. Board needs to match before handoff.',
    category: 'administrative',
    priority: 'normal',
    status: 'open',
    assigneeId: 'm-samuel',
    shiftId: 's-day',
    dueOffsetHours: 3,
    createdOffsetHours: -2,
  },
  {
    id: 't-07',
    title: 'Verify discharge instruction packet is assembled',
    description:
      'Clerical assembly check only. Confirms every page authored by the care team made it into the printed packet.',
    category: 'documentation',
    priority: 'normal',
    status: 'in-progress',
    assigneeId: 'm-devon',
    shiftId: 's-day',
    caseLabel: 'Demo Case E',
    dueOffsetHours: 1.5,
    createdOffsetHours: -3.5,
    notes: [
      {
        authorId: 'm-devon',
        body: 'Two pages were missing from the print job. Reprinted and re-collated at 13:20.',
        offsetHours: -0.75,
      },
    ],
  },
  {
    id: 't-08',
    title: 'Schedule follow-up appointment reminder call',
    description: 'Confirm the preferred contact method on file, then place the reminder call.',
    category: 'follow-up',
    priority: 'normal',
    status: 'open',
    assigneeId: 'm-devon',
    shiftId: 's-day',
    caseLabel: 'Demo Case E',
    dueOffsetHours: 4,
    createdOffsetHours: -3.5,
  },
  {
    id: 't-09',
    title: 'Restock supply cart after room turnover',
    description: 'Standard turnover restock against the unit par list.',
    category: 'equipment',
    priority: 'low',
    status: 'complete',
    assigneeId: 'm-tasha',
    shiftId: 's-day',
    caseLabel: 'Demo Case F',
    dueOffsetHours: -3,
    createdOffsetHours: -5.5,
    completedOffsetHours: -3.1,
  },
  {
    id: 't-10',
    title: 'Log annual competency completion for two staff members',
    description: 'Entries go into the education tracking spreadsheet and the unit binder.',
    category: 'education',
    priority: 'low',
    status: 'open',
    assigneeId: 'm-joyce',
    shiftId: 's-day',
    dueOffsetHours: 5,
    createdOffsetHours: -2.5,
  },
  {
    id: 't-11',
    title: 'Send shift-change preparation reminder to the team',
    description: 'Group message reminding everyone to refresh task statuses before 18:00.',
    category: 'communication',
    priority: 'normal',
    status: 'complete',
    assigneeId: 'm-samuel',
    shiftId: 's-day',
    dueOffsetHours: -1,
    createdOffsetHours: -2,
    completedOffsetHours: -1.2,
  },
  {
    id: 't-12',
    title: 'Reconcile paper chart inserts with the scanning queue',
    description: 'Three inserts from this morning have not appeared in the scanning queue yet.',
    category: 'documentation',
    priority: 'normal',
    status: 'open',
    assigneeId: 'm-marcus',
    shiftId: 's-day',
    dueOffsetHours: 2.5,
    createdOffsetHours: -1.5,
  },
  {
    id: 't-13',
    title: 'Coordinate room turnover with environmental services',
    description: 'Turnover request placed. Waiting on an assigned window from the EVS dispatcher.',
    category: 'coordination',
    priority: 'normal',
    status: 'in-progress',
    assigneeId: 'm-tasha',
    shiftId: 's-day',
    caseLabel: 'Demo Case F',
    dueOffsetHours: 0.75,
    createdOffsetHours: -2.75,
  },
  {
    id: 't-14',
    title: 'Confirm receipt of transfer paperwork from the sending unit',
    description:
      'Packet arrived incomplete. Sending unit is re-sending the missing coordination summary.',
    category: 'coordination',
    priority: 'high',
    status: 'awaiting-handoff',
    assigneeId: 'm-priya',
    shiftId: 's-day',
    caseLabel: 'Demo Case D',
    dueOffsetHours: 0.5,
    createdOffsetHours: -4,
  },
  {
    id: 't-15',
    title: 'Return borrowed vital-signs monitor to central supply',
    description: 'Asset tag recorded in the equipment log. Needs to be walked down before 19:00.',
    category: 'equipment',
    priority: 'normal',
    status: 'open',
    assigneeId: 'm-tasha',
    shiftId: 's-day',
    dueOffsetHours: 6,
    createdOffsetHours: -1,
  },
  {
    id: 't-16',
    title: 'Draft orientation checklist for incoming float staff',
    description: 'Reuses the shift-change preparation template as a starting point.',
    category: 'education',
    priority: 'low',
    status: 'open',
    assigneeId: 'm-joyce',
    shiftId: 's-day',
    dueOffsetHours: 20,
    createdOffsetHours: -1,
  },
  {
    id: 't-17',
    title: 'Update the on-call coordination contact list',
    description: 'Two desk numbers changed after the department reorganisation.',
    category: 'administrative',
    priority: 'low',
    status: 'open',
    assigneeId: 'm-marcus',
    shiftId: 's-day',
    dueOffsetHours: 7,
    createdOffsetHours: -0.75,
  },
  {
    id: 't-18',
    title: 'Follow up on unreturned pager from the previous shift',
    description:
      'Pager was not in the handoff drawer this morning. Blocked pending a response from the night charge nurse.',
    category: 'follow-up',
    priority: 'normal',
    status: 'blocked',
    assigneeId: 'm-samuel',
    shiftId: 's-day',
    dueOffsetHours: -2,
    createdOffsetHours: -6,
    notes: [
      {
        authorId: 'm-samuel',
        body: 'Left a message with the night charge nurse. Will re-check at handoff rather than paging again.',
        offsetHours: -3,
      },
    ],
  },
  {
    id: 't-19',
    title: 'Prepare the shift-change summary board',
    description: 'Standing task that opens at the start of every night shift.',
    category: 'administrative',
    priority: 'normal',
    status: 'open',
    assigneeId: null,
    shiftId: 's-night',
    dueOffsetHours: 12.5,
    createdOffsetHours: -0.5,
  },
  {
    id: 't-20',
    title: 'Verify equipment handoff log signatures',
    description: 'Confirms every equipment movement from the day shift was signed for.',
    category: 'equipment',
    priority: 'normal',
    status: 'open',
    assigneeId: null,
    shiftId: 's-night',
    dueOffsetHours: 13,
    createdOffsetHours: -0.5,
  },
  {
    id: 't-21',
    title: 'Complete transfer workflow documentation review',
    description: 'End-of-shift review of the transfer packet filed overnight.',
    category: 'documentation',
    priority: 'normal',
    status: 'complete',
    assigneeId: 'm-priya',
    shiftId: 's-prev-night',
    caseLabel: 'Demo Case D',
    dueOffsetHours: -9,
    createdOffsetHours: -14,
    completedOffsetHours: -9.5,
  },
  {
    id: 't-22',
    title: 'Call day-shift charge with the overnight coordination summary',
    description: 'Verbal summary placed before the written handoff was shared.',
    category: 'communication',
    priority: 'normal',
    status: 'complete',
    assigneeId: 'm-samuel',
    shiftId: 's-prev-night',
    dueOffsetHours: -7.5,
    createdOffsetHours: -12,
    completedOffsetHours: -7.6,
  },
]

/* ------------------------------------------------------------------ *
 * Checklists
 * ------------------------------------------------------------------ */

interface ChecklistSeed {
  id: string
  templateId: string
  title: string
  shiftId: string
  caseLabel?: string
  /** Number of leading steps marked complete. */
  completedCount: number
  assignees: Array<string | null>
  notes?: Record<number, string>
  startedOffsetHours: number
}

const CHECKLIST_SEEDS: ChecklistSeed[] = [
  {
    id: 'cl-01',
    templateId: 'tpl-admission',
    title: 'Admission workflow — Demo Case B',
    shiftId: 's-day',
    caseLabel: 'Demo Case B',
    completedCount: 4,
    assignees: ['m-marcus', 'm-samuel', 'm-marcus', 'm-renee', 'm-marcus', 'm-samuel', 'm-samuel'],
    notes: { 2: 'Secondary contact number was missing and has been added.' },
    startedOffsetHours: -3.5,
  },
  {
    id: 'cl-02',
    templateId: 'tpl-discharge',
    title: 'Discharge coordination — Demo Case E',
    shiftId: 's-day',
    caseLabel: 'Demo Case E',
    completedCount: 3,
    assignees: [
      'm-marcus',
      'm-marcus',
      'm-devon',
      'm-devon',
      'm-tasha',
      'm-renee',
      'm-tasha',
    ],
    notes: { 2: 'Pickup window confirmed for late afternoon.' },
    startedOffsetHours: -4,
  },
  {
    id: 'cl-03',
    templateId: 'tpl-equipment',
    title: 'Equipment handoff — Demo Case C',
    shiftId: 's-day',
    caseLabel: 'Demo Case C',
    completedCount: 5,
    assignees: ['m-tasha', 'm-tasha', 'm-marcus', 'm-tasha', 'm-marcus'],
    startedOffsetHours: -5,
  },
  {
    id: 'cl-04',
    templateId: 'tpl-transfer',
    title: 'Transfer workflow — Demo Case D',
    shiftId: 's-day',
    caseLabel: 'Demo Case D',
    completedCount: 2,
    assignees: ['m-samuel', 'm-marcus', 'm-devon', 'm-tasha', 'm-priya', 'm-samuel'],
    notes: { 1: 'Coordination summary page is still missing from the packet.' },
    startedOffsetHours: -4.25,
  },
  {
    id: 'cl-05',
    templateId: 'tpl-shift-change',
    title: 'Shift-change preparation — Day shift',
    shiftId: 's-day',
    caseLabel: undefined,
    completedCount: 1,
    assignees: ['m-samuel', 'm-renee', 'm-samuel', 'm-samuel', 'm-marcus'],
    startedOffsetHours: -1,
  },
]

/* ------------------------------------------------------------------ *
 * Handoffs
 * ------------------------------------------------------------------ */

const emptySections = (): HandoffSections => ({
  situation: '',
  background: '',
  outstandingTasks: '',
  communicationCompleted: '',
  followUpNeeded: '',
  questions: '',
})

interface HandoffSeed {
  id: string
  title: string
  shiftId: string
  fromMemberId: string
  toMemberId: string | null
  status: HandoffRecord['status']
  caseLabel?: string
  sections: Partial<HandoffSections>
  linkedTaskIds: string[]
  createdOffsetHours: number
  updatedOffsetHours: number
  handedOffOffsetHours?: number
}

const HANDOFF_SEEDS: HandoffSeed[] = [
  {
    id: 'h-01',
    title: 'Day shift charge handoff',
    shiftId: 's-day',
    fromMemberId: 'm-samuel',
    toMemberId: null,
    status: 'draft',
    sections: {
      situation:
        'Assignment board is current through the afternoon. Two coordination items are still open and one equipment return is waiting on a signature.',
      outstandingTasks:
        'Bed placement call for Demo Case D is blocked until the placement desk reopens. Telemetry box return needs a receiving signature.',
    },
    linkedTaskIds: ['t-04', 't-03'],
    createdOffsetHours: -1,
    updatedOffsetHours: -0.25,
  },
  {
    id: 'h-02',
    title: 'Discharge coordination handoff — Demo Case E',
    shiftId: 's-day',
    fromMemberId: 'm-devon',
    toMemberId: 'm-priya',
    status: 'ready',
    caseLabel: 'Demo Case E',
    sections: {
      situation:
        'Discharge coordination is three steps from complete. Packet is assembled and transportation is arranged.',
      background:
        'Coordination started this morning. The instruction packet was reprinted once because two pages were missing from the original print job.',
      outstandingTasks:
        'Follow-up reminder call has not been placed yet. Borrowed equipment reconciliation is still open.',
      communicationCompleted:
        'Transportation contact confirmed the pickup window. Environmental services has the turnover request.',
      followUpNeeded:
        'Place the reminder call once the preferred contact method is confirmed, then close the follow-up task.',
      questions: 'Should the equipment reconciliation be completed before or after room turnover?',
    },
    linkedTaskIds: ['t-08', 't-07'],
    createdOffsetHours: -2.5,
    updatedOffsetHours: -0.5,
  },
  {
    id: 'h-03',
    title: 'Night shift handoff — coordination summary',
    shiftId: 's-prev-night',
    fromMemberId: 'm-priya',
    toMemberId: 'm-samuel',
    status: 'handed-off',
    sections: {
      situation:
        'Overnight coordination was quiet. Transfer paperwork for Demo Case D was filed and the documentation review is complete.',
      background:
        'Transfer packet arrived late in the shift and was reviewed against the transfer workflow checklist before filing.',
      outstandingTasks:
        'One pager was not returned to the handoff drawer. Day shift should confirm whether it was left in the break room.',
      communicationCompleted:
        'Called the day-shift charge nurse with the verbal summary before shift change.',
      followUpNeeded: 'Confirm the pager location and update the equipment log if it is recovered.',
      questions: 'Does the day team want the transfer packet copy or the original?',
    },
    linkedTaskIds: ['t-21', 't-18'],
    createdOffsetHours: -9,
    updatedOffsetHours: -7.7,
    handedOffOffsetHours: -7.6,
  },
  {
    id: 'h-04',
    title: 'Equipment handoff summary — Demo Case C',
    shiftId: 's-prev-night',
    fromMemberId: 'm-tasha',
    toMemberId: 'm-renee',
    status: 'handed-off',
    caseLabel: 'Demo Case C',
    sections: {
      situation: 'Equipment inventory was completed and the log is current through the night shift.',
      background:
        'Two devices were returned to central supply. A telemetry box is still assigned to the unit.',
      outstandingTasks: 'Telemetry box return needs to be walked down and signed for by biomedical engineering.',
      communicationCompleted: 'Central supply confirmed receipt of the two returned devices.',
      followUpNeeded: 'File the completed transfer log once the signature is obtained.',
    },
    linkedTaskIds: ['t-03'],
    createdOffsetHours: -10,
    updatedOffsetHours: -7.9,
    handedOffOffsetHours: -7.8,
  },
]

/* ------------------------------------------------------------------ *
 * Builders
 * ------------------------------------------------------------------ */

function buildShifts(anchor: Date): Shift[] {
  const dayStart = atHour(anchor, 7)
  const dayEnd = atHour(anchor, 19)
  const nightStart = atHour(anchor, 19)
  const nightEnd = atHour(addDays(anchor, 1), 7)
  const prevNightStart = atHour(addDays(anchor, -1), 19)
  const prevNightEnd = atHour(anchor, 7)

  return [
    {
      id: 's-day',
      label: 'Day shift',
      unit: 'Med-Surg 4 West (demo unit)',
      status: 'active',
      startsAt: iso(dayStart),
      endsAt: iso(dayEnd),
      chargeMemberId: 'm-samuel',
      memberIds: ['m-samuel', 'm-renee', 'm-devon', 'm-priya', 'm-marcus', 'm-tasha', 'm-joyce'],
    },
    {
      id: 's-night',
      label: 'Night shift',
      unit: 'Med-Surg 4 West (demo unit)',
      status: 'upcoming',
      startsAt: iso(nightStart),
      endsAt: iso(nightEnd),
      chargeMemberId: 'm-priya',
      memberIds: ['m-priya', 'm-renee', 'm-tasha', 'm-marcus'],
    },
    {
      id: 's-prev-night',
      label: 'Night shift (previous)',
      unit: 'Med-Surg 4 West (demo unit)',
      status: 'archived',
      startsAt: iso(prevNightStart),
      endsAt: iso(prevNightEnd),
      chargeMemberId: 'm-priya',
      memberIds: ['m-priya', 'm-tasha', 'm-samuel'],
    },
  ]
}

function buildTemplates(anchor: Date): WorkflowTemplate[] {
  const createdAt = iso(addDays(anchor, -30))
  return TEMPLATE_SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    description: seed.description,
    kind: seed.kind,
    steps: buildSteps(seed.id, seed.steps),
    isSeeded: true,
    createdAt,
    updatedAt: createdAt,
  }))
}

function buildTasks(anchor: Date): Task[] {
  return TASK_SEEDS.map((seed) => {
    const createdAt = iso(addHours(anchor, seed.createdOffsetHours))
    const completedAt =
      seed.completedOffsetHours !== undefined
        ? iso(addHours(anchor, seed.completedOffsetHours))
        : null
    return {
      id: seed.id,
      title: seed.title,
      description: seed.description,
      category: seed.category,
      priority: seed.priority,
      status: seed.status,
      assigneeId: seed.assigneeId,
      shiftId: seed.shiftId,
      caseLabel: seed.caseLabel ?? null,
      dueAt: seed.dueOffsetHours === null ? null : iso(addHours(anchor, seed.dueOffsetHours)),
      createdAt,
      updatedAt: completedAt ?? createdAt,
      completedAt,
      notes: (seed.notes ?? []).map((note, index) => ({
        id: `${seed.id}-n${index + 1}`,
        authorId: note.authorId,
        body: note.body,
        createdAt: iso(addHours(anchor, note.offsetHours)),
      })),
    }
  })
}

function buildChecklists(anchor: Date, templates: WorkflowTemplate[]): Checklist[] {
  return CHECKLIST_SEEDS.map((seed) => {
    const template = templates.find((t) => t.id === seed.templateId)
    if (!template) throw new Error(`Seed error: unknown template ${seed.templateId}`)
    const enabledSteps = template.steps.filter((step) => step.enabled)
    const createdAt = iso(addHours(anchor, seed.startedOffsetHours))

    const steps: ChecklistStep[] = enabledSteps.map((step, index) => {
      const complete = index < seed.completedCount
      return {
        id: `${seed.id}-s${index + 1}`,
        label: step.label,
        hint: step.hint,
        complete,
        assigneeId: seed.assignees[index] ?? null,
        note: seed.notes?.[index] ?? '',
        completedAt: complete
          ? iso(addMinutes(addHours(anchor, seed.startedOffsetHours), (index + 1) * 18))
          : null,
      }
    })

    const allComplete = steps.length > 0 && steps.every((s) => s.complete)
    const lastCompletedAt = steps.filter((s) => s.completedAt).at(-1)?.completedAt ?? null

    return {
      id: seed.id,
      title: seed.title,
      templateId: template.id,
      templateName: template.name,
      kind: template.kind,
      shiftId: seed.shiftId,
      caseLabel: seed.caseLabel ?? null,
      status: allComplete ? 'complete' : 'active',
      steps,
      createdAt,
      updatedAt: lastCompletedAt ?? createdAt,
      completedAt: allComplete ? lastCompletedAt : null,
    }
  })
}

function buildHandoffs(anchor: Date): HandoffRecord[] {
  return HANDOFF_SEEDS.map((seed) => ({
    id: seed.id,
    title: seed.title,
    shiftId: seed.shiftId,
    fromMemberId: seed.fromMemberId,
    toMemberId: seed.toMemberId,
    status: seed.status,
    caseLabel: seed.caseLabel ?? null,
    sections: { ...emptySections(), ...seed.sections },
    linkedTaskIds: seed.linkedTaskIds,
    createdAt: iso(addHours(anchor, seed.createdOffsetHours)),
    updatedAt: iso(addHours(anchor, seed.updatedOffsetHours)),
    handedOffAt:
      seed.handedOffOffsetHours !== undefined
        ? iso(addHours(anchor, seed.handedOffOffsetHours))
        : null,
  }))
}

interface ActivitySeed {
  offsetHours: number
  kind: ActivityEvent['kind']
  entity: ActivityEvent['entity']
  entityId: string
  summary: string
  actorId: string | null
  detail?: string
}

const ACTIVITY_SEEDS: ActivitySeed[] = [
  {
    offsetHours: -12,
    kind: 'created',
    entity: 'handoff',
    entityId: 'h-04',
    summary: 'Started the equipment handoff summary for Demo Case C',
    actorId: 'm-tasha',
  },
  {
    offsetHours: -9.5,
    kind: 'completed',
    entity: 'task',
    entityId: 't-21',
    summary: 'Completed "Complete transfer workflow documentation review"',
    actorId: 'm-priya',
  },
  {
    offsetHours: -7.8,
    kind: 'handed-off',
    entity: 'handoff',
    entityId: 'h-04',
    summary: 'Marked the equipment handoff summary as handed off',
    actorId: 'm-tasha',
    detail: 'to Renee Alcantara',
  },
  {
    offsetHours: -7.6,
    kind: 'handed-off',
    entity: 'handoff',
    entityId: 'h-03',
    summary: 'Marked the night shift coordination handoff as handed off',
    actorId: 'm-priya',
    detail: 'to Samuel Garcia',
  },
  {
    offsetHours: -6,
    kind: 'created',
    entity: 'task',
    entityId: 't-18',
    summary: 'Created "Follow up on unreturned pager from the previous shift"',
    actorId: 'm-samuel',
  },
  {
    offsetHours: -5,
    kind: 'created',
    entity: 'checklist',
    entityId: 'cl-03',
    summary: 'Started the Equipment handoff checklist for Demo Case C',
    actorId: 'm-tasha',
  },
  {
    offsetHours: -4.25,
    kind: 'created',
    entity: 'checklist',
    entityId: 'cl-04',
    summary: 'Started the Transfer workflow checklist for Demo Case D',
    actorId: 'm-samuel',
  },
  {
    offsetHours: -4,
    kind: 'created',
    entity: 'checklist',
    entityId: 'cl-02',
    summary: 'Started the Discharge coordination checklist for Demo Case E',
    actorId: 'm-devon',
  },
  {
    offsetHours: -3.5,
    kind: 'created',
    entity: 'checklist',
    entityId: 'cl-01',
    summary: 'Started the Admission workflow checklist for Demo Case B',
    actorId: 'm-marcus',
  },
  {
    offsetHours: -3.1,
    kind: 'completed',
    entity: 'task',
    entityId: 't-09',
    summary: 'Completed "Restock supply cart after room turnover"',
    actorId: 'm-tasha',
  },
  {
    offsetHours: -3,
    kind: 'note-added',
    entity: 'task',
    entityId: 't-18',
    summary: 'Added a note to "Follow up on unreturned pager from the previous shift"',
    actorId: 'm-samuel',
  },
  {
    offsetHours: -2.5,
    kind: 'created',
    entity: 'handoff',
    entityId: 'h-02',
    summary: 'Started the discharge coordination handoff for Demo Case E',
    actorId: 'm-devon',
  },
  {
    offsetHours: -2.25,
    kind: 'completed',
    entity: 'task',
    entityId: 't-05',
    summary: 'Completed "File signed consent-to-treat form copies"',
    actorId: 'm-marcus',
  },
  {
    offsetHours: -2,
    kind: 'step-completed',
    entity: 'checklist',
    entityId: 'cl-01',
    summary: 'Completed a step on the Admission workflow checklist',
    actorId: 'm-renee',
    detail: 'Collect signed consent-to-treat and privacy acknowledgement forms',
  },
  {
    offsetHours: -1.5,
    kind: 'note-added',
    entity: 'task',
    entityId: 't-04',
    summary: 'Added a note to "Call coordination desk about pending bed assignment"',
    actorId: 'm-priya',
  },
  {
    offsetHours: -1.2,
    kind: 'completed',
    entity: 'task',
    entityId: 't-11',
    summary: 'Completed "Send shift-change preparation reminder to the team"',
    actorId: 'm-samuel',
  },
  {
    offsetHours: -1,
    kind: 'created',
    entity: 'handoff',
    entityId: 'h-01',
    summary: 'Started the day shift charge handoff draft',
    actorId: 'm-samuel',
  },
  {
    offsetHours: -1,
    kind: 'status-changed',
    entity: 'task',
    entityId: 't-04',
    summary: 'Moved "Call coordination desk about pending bed assignment" to Blocked',
    actorId: 'm-priya',
    detail: 'In progress → Blocked',
  },
  {
    offsetHours: -0.9,
    kind: 'created',
    entity: 'checklist',
    entityId: 'cl-05',
    summary: 'Started the Shift-change preparation checklist',
    actorId: 'm-samuel',
  },
  {
    offsetHours: -0.75,
    kind: 'note-added',
    entity: 'task',
    entityId: 't-07',
    summary: 'Added a note to "Verify discharge instruction packet is assembled"',
    actorId: 'm-devon',
  },
  {
    offsetHours: -0.6,
    kind: 'status-changed',
    entity: 'task',
    entityId: 't-14',
    summary: 'Moved "Confirm receipt of transfer paperwork from the sending unit" to Awaiting handoff',
    actorId: 'm-priya',
    detail: 'In progress → Awaiting handoff',
  },
  {
    offsetHours: -0.5,
    kind: 'updated',
    entity: 'handoff',
    entityId: 'h-02',
    summary: 'Updated the discharge coordination handoff sections',
    actorId: 'm-devon',
  },
  {
    offsetHours: -0.4,
    kind: 'assigned',
    entity: 'task',
    entityId: 't-15',
    summary: 'Assigned "Return borrowed vital-signs monitor to central supply"',
    actorId: 'm-samuel',
    detail: 'to Tasha Brennan',
  },
  {
    offsetHours: -0.3,
    kind: 'status-changed',
    entity: 'task',
    entityId: 't-03',
    summary: 'Moved "Return telemetry box to biomedical engineering" to Awaiting handoff',
    actorId: 'm-tasha',
    detail: 'In progress → Awaiting handoff',
  },
  {
    offsetHours: -0.25,
    kind: 'updated',
    entity: 'handoff',
    entityId: 'h-01',
    summary: 'Updated the day shift charge handoff draft',
    actorId: 'm-samuel',
  },
  {
    offsetHours: -0.15,
    kind: 'step-completed',
    entity: 'checklist',
    entityId: 'cl-02',
    summary: 'Completed a step on the Discharge coordination checklist',
    actorId: 'm-devon',
    detail: 'Confirm transportation arrangements with the listed contact',
  },
]

function buildActivity(anchor: Date): ActivityEvent[] {
  return ACTIVITY_SEEDS.map((seed, index) => ({
    id: `a-${String(index + 1).padStart(3, '0')}`,
    at: iso(addHours(anchor, seed.offsetHours)),
    kind: seed.kind,
    entity: seed.entity,
    entityId: seed.entityId,
    summary: seed.summary,
    actorId: seed.actorId,
    detail: seed.detail ?? null,
  })).sort((a, b) => b.at.localeCompare(a.at))
}

/**
 * Builds a complete demo dataset.
 *
 * The dataset is anchored to `now` so the seeded shift always looks current,
 * and is fully deterministic for a given anchor (useful in tests).
 */
export function buildSeedState(now: Date = new Date()): DemoState {
  const anchor = new Date(now)
  const templates = buildTemplates(anchor)

  return {
    schemaVersion: SCHEMA_VERSION,
    currentUserId: CURRENT_USER_ID,
    activeShiftId: ACTIVE_SHIFT_ID,
    members: MEMBERS.map((m) => ({ ...m })),
    shifts: buildShifts(anchor),
    tasks: buildTasks(anchor),
    handoffs: buildHandoffs(anchor),
    templates,
    checklists: buildChecklists(anchor, templates),
    activity: buildActivity(anchor),
  }
}
