import type { Task, TeamMember } from '@/types/domain'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import { CATEGORY_LABELS, PRIORITY_LABELS, PRIORITY_TONES } from '@/lib/labels'
import { formatDateTime, formatTime, isOverdue } from '@/lib/time'

export interface TaskCardProps {
  task: Task
  assignee: TeamMember | null
  onOpen: (task: Task) => void
  /** Shows the full date instead of just the time — used in list views. */
  showDate?: boolean
}

export function TaskCard({ task, assignee, onOpen, showDate = false }: TaskCardProps) {
  const overdue = task.status !== 'complete' && isOverdue(task.dueAt)
  const dueText = task.dueAt
    ? showDate
      ? formatDateTime(task.dueAt)
      : formatTime(task.dueAt)
    : null

  return (
    <button
      type="button"
      className={`task-card priority-${task.priority} ${task.status === 'complete' ? 'is-complete' : ''}`.trim()}
      onClick={() => onOpen(task)}
      aria-label={`Open task: ${task.title}`}
    >
      <p className="task-card-title">{task.title}</p>

      <div className="task-card-meta">
        <Avatar member={assignee} size="sm" showTitle={false} />
        <span className="truncate" style={{ maxWidth: '10rem' }}>
          {assignee ? assignee.name : 'Unassigned'}
        </span>
        {dueText ? (
          <>
            <span aria-hidden="true">·</span>
            <span className={`task-due ${overdue ? 'is-overdue' : ''}`.trim()}>
              <Icon name={overdue ? 'alert' : 'clock'} size={12} />
              {overdue ? `Past due ${dueText}` : dueText}
            </span>
          </>
        ) : null}
        {task.notes.length > 0 ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="task-due" title={`${task.notes.length} note(s)`}>
              <Icon name="file" size={12} />
              {task.notes.length}
            </span>
          </>
        ) : null}
      </div>

      <div className="task-card-markers">
        <Badge tone={PRIORITY_TONES[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>
        <Badge tone="neutral">{CATEGORY_LABELS[task.category]}</Badge>
        {task.caseLabel ? <span className="case-chip">{task.caseLabel}</span> : null}
      </div>
    </button>
  )
}
