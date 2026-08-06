import { useState } from 'react'

import type { Task, TaskStatus } from '@/types/domain'
import { TASK_STATUSES } from '@/types/domain'
import { useDemoStore } from '@/store/useDemoStore'
import { findMember } from '@/store/selectors'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Badge, CaseChip } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { SelectField, TextArea } from '@/components/ui/Form'
import { ConfirmDialog } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONES,
  STATUS_LABELS,
  STATUS_TONES,
} from '@/lib/labels'
import { formatDateTime, formatRelative, isOverdue } from '@/lib/time'
import { assigneeOptions } from './options'

export interface TaskDetailDrawerProps {
  task: Task | null
  onClose: () => void
  onEdit: (task: Task) => void
}

export function TaskDetailDrawer({ task, onClose, onEdit }: TaskDetailDrawerProps) {
  const members = useDemoStore((state) => state.members)
  const shifts = useDemoStore((state) => state.shifts)
  const setTaskStatus = useDemoStore((state) => state.setTaskStatus)
  const updateTask = useDemoStore((state) => state.updateTask)
  const addTaskNote = useDemoStore((state) => state.addTaskNote)
  const deleteTask = useDemoStore((state) => state.deleteTask)
  const { notify } = useToast()

  const [note, setNote] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!task) return null

  const shift = shifts.find((s) => s.id === task.shiftId)
  const overdue = task.status !== 'complete' && isOverdue(task.dueAt)

  const handleAddNote = () => {
    const trimmed = note.trim()
    if (!trimmed) return
    addTaskNote(task.id, trimmed)
    setNote('')
    notify('Note added to the task.', 'success')
  }

  const handleDelete = () => {
    deleteTask(task.id)
    setConfirmDelete(false)
    notify('Task deleted.', 'info')
    onClose()
  }

  return (
    <>
      <Drawer
        open
        onClose={onClose}
        eyebrow={CATEGORY_LABELS[task.category]}
        title={task.title}
        headerExtra={
          <div className="row row-wrap" style={{ marginTop: 'var(--space-2)' }}>
            <Badge tone={STATUS_TONES[task.status]} dot>
              {STATUS_LABELS[task.status]}
            </Badge>
            <Badge tone={PRIORITY_TONES[task.priority]}>
              {PRIORITY_LABELS[task.priority]} priority
            </Badge>
            {task.caseLabel ? <CaseChip label={task.caseLabel} /> : null}
          </div>
        }
        footer={
          <>
            <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
            <div className="spacer" />
            <Button variant="secondary" icon="edit" onClick={() => onEdit(task)}>
              Edit
            </Button>
            {task.status === 'complete' ? (
              <Button variant="primary" icon="refresh" onClick={() => setTaskStatus(task.id, 'open')}>
                Reopen
              </Button>
            ) : (
              <Button
                variant="primary"
                icon="check"
                onClick={() => {
                  setTaskStatus(task.id, 'complete')
                  notify('Task marked complete.', 'success')
                }}
              >
                Mark complete
              </Button>
            )}
          </>
        }
      >
        <div className="stack stack-6">
          {task.description ? (
            <p className="text-secondary" style={{ whiteSpace: 'pre-wrap' }}>
              {task.description}
            </p>
          ) : (
            <p className="text-muted text-sm">No additional details were added to this task.</p>
          )}

          <section aria-labelledby="task-status-heading" className="stack stack-3">
            <h3 className="card-title" id="task-status-heading">
              Status
            </h3>
            <div className="segmented" role="group" aria-label="Change task status">
              {TASK_STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  aria-pressed={task.status === status}
                  onClick={() => setTaskStatus(task.id, status as TaskStatus)}
                >
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </section>

          <section aria-labelledby="task-facts-heading" className="stack stack-3">
            <h3 className="card-title" id="task-facts-heading">
              Details
            </h3>
            <dl className="detail-grid">
              <dt className="detail-term">Assigned to</dt>
              <dd className="detail-value">
                <SelectField
                  label="Assigned to"
                  hideLabel
                  options={assigneeOptions(members)}
                  value={task.assigneeId ?? ''}
                  onChange={(event) =>
                    updateTask(task.id, { assigneeId: event.target.value || null })
                  }
                />
              </dd>

              <dt className="detail-term">Due</dt>
              <dd className="detail-value">
                {task.dueAt ? (
                  <span className={overdue ? 'task-due is-overdue' : ''}>
                    {formatDateTime(task.dueAt)}
                    <span className="text-muted"> · {formatRelative(task.dueAt)}</span>
                  </span>
                ) : (
                  <span className="text-muted">No due time set</span>
                )}
              </dd>

              <dt className="detail-term">Shift</dt>
              <dd className="detail-value">{shift ? `${shift.label} · ${shift.unit}` : '—'}</dd>

              <dt className="detail-term">Created</dt>
              <dd className="detail-value">
                {formatDateTime(task.createdAt)}
                <span className="text-muted"> · {formatRelative(task.createdAt)}</span>
              </dd>

              <dt className="detail-term">Last updated</dt>
              <dd className="detail-value">{formatRelative(task.updatedAt)}</dd>

              {task.completedAt ? (
                <>
                  <dt className="detail-term">Completed</dt>
                  <dd className="detail-value">{formatDateTime(task.completedAt)}</dd>
                </>
              ) : null}
            </dl>
          </section>

          <section aria-labelledby="task-notes-heading" className="stack stack-3">
            <h3 className="card-title" id="task-notes-heading">
              Notes &amp; completion history
            </h3>

            {task.notes.length === 0 ? (
              <EmptyState
                icon="file"
                title="No notes yet"
                body="Add a short note so the next person knows what has already been tried."
              />
            ) : (
              <ul className="note-list">
                {task.notes.map((entry) => {
                  const author = findMember(members, entry.authorId)
                  return (
                    <li key={entry.id} className="note">
                      <div className="note-head">
                        <Avatar member={author} size="sm" showTitle={false} />
                        <span className="note-author">{author?.name ?? 'Demo user'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelative(entry.createdAt)}</span>
                      </div>
                      <p className="note-body">{entry.body}</p>
                    </li>
                  )
                })}
              </ul>
            )}

            <TextArea
              label="Add a note"
              value={note}
              placeholder="e.g. Called the coordination desk; asked for a callback in 45 minutes."
              help="Administrative coordination notes only."
              onChange={(event) => setNote(event.target.value)}
            />
            <div className="row">
              <div className="spacer" />
              <Button variant="secondary" icon="send" onClick={handleAddNote} disabled={!note.trim()}>
                Add note
              </Button>
            </div>
          </section>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this task?"
        message={`"${task.title}" will be removed from the board and unlinked from any handoff packets.`}
        confirmLabel="Delete task"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  )
}
