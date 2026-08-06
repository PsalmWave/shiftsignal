import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { useDemoStore } from '@/store/useDemoStore'
import { checklistProgress, findMember } from '@/store/selectors'
import { PageHeader, SafetyNote } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, CaseChip } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/components/ui/Toast'
import {
  CHECKLIST_STATUS_LABELS,
  CHECKLIST_STATUS_TONES,
  WORKFLOW_LABELS,
} from '@/lib/labels'
import { formatDateTime, formatRelative } from '@/lib/time'

export function ChecklistDetailPage() {
  const { checklistId } = useParams<{ checklistId: string }>()
  const navigate = useNavigate()
  const { notify } = useToast()

  const checklists = useDemoStore((state) => state.checklists)
  const members = useDemoStore((state) => state.members)
  const shifts = useDemoStore((state) => state.shifts)
  const toggleStep = useDemoStore((state) => state.toggleChecklistStep)
  const updateStep = useDemoStore((state) => state.updateChecklistStep)
  const archiveChecklist = useDemoStore((state) => state.archiveChecklist)
  const deleteChecklist = useDemoStore((state) => state.deleteChecklist)

  const [confirmDelete, setConfirmDelete] = useState(false)

  const checklist = checklists.find((item) => item.id === checklistId)

  if (!checklist) {
    return (
      <div className="page">
        <Card>
          <CardBody>
            <EmptyState
              icon="checklist"
              title="Checklist not found"
              body="This checklist may have been deleted, or the demo data was reset in this browser."
              action={
                <Link className="btn btn-primary" to="/checklists">
                  Back to checklists
                </Link>
              }
            />
          </CardBody>
        </Card>
      </div>
    )
  }

  const progress = checklistProgress(checklist)
  const shift = shifts.find((s) => s.id === checklist.shiftId)
  const readOnly = checklist.status === 'archived'
  // The first outstanding step is what the track highlights as "current".
  const currentStepIndex = readOnly ? -1 : checklist.steps.findIndex((step) => !step.complete)

  const handleDelete = () => {
    deleteChecklist(checklist.id)
    setConfirmDelete(false)
    notify('Checklist deleted.', 'info')
    navigate('/checklists')
  }

  return (
    <div className="page">
      <div>
        <Link className="btn btn-ghost btn-sm" to="/checklists">
          ← All checklists
        </Link>
      </div>

      <PageHeader
        eyebrow={WORKFLOW_LABELS[checklist.kind]}
        eyebrowIcon="checklist"
        title={checklist.title}
        description={`Created from the "${checklist.templateName}" template · ${shift ? shift.label : 'Unassigned shift'} · updated ${formatRelative(checklist.updatedAt)}`}
        actions={
          <>
            {!readOnly ? (
              <Button
                variant="secondary"
                icon="inbox"
                onClick={() => {
                  archiveChecklist(checklist.id)
                  notify('Checklist archived.', 'info')
                }}
              >
                Archive
              </Button>
            ) : null}
            <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          </>
        }
      />

      <SafetyNote>
        <strong>Administrative steps only.</strong> Checking a step records that a coordination task
        was done. It is not a clinical attestation and carries no medical meaning.
      </SafetyNote>

      <Card>
        <CardBody className="stack stack-4">
          <div className="row row-wrap">
            <Badge tone={CHECKLIST_STATUS_TONES[checklist.status]} dot>
              {CHECKLIST_STATUS_LABELS[checklist.status]}
            </Badge>
            {checklist.caseLabel ? <CaseChip label={checklist.caseLabel} /> : null}
            {checklist.completedAt ? (
              <span className="text-xs text-muted">
                Completed {formatDateTime(checklist.completedAt)}
              </span>
            ) : null}
          </div>
          <Progress
            label="Checklist progress"
            value={progress.completed}
            max={progress.total}
            showMeta
            metaLeft={`${progress.completed} of ${progress.total} steps complete`}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          headingLevel={2}
          title="Steps"
          subtitle="Assign an owner and add a short note so the next person has context."
        />
        <CardBody flush>
          {checklist.steps.length === 0 ? (
            <EmptyState
              icon="checklist"
              title="This checklist has no steps"
              body="The source template had no enabled steps when this checklist was created."
            />
          ) : (
            <ul className="checklist-steps">
              {checklist.steps.map((step, index) => {
                const assignee = findMember(members, step.assigneeId)
                const checkboxId = `step-${step.id}`
                return (
                  <li
                    key={step.id}
                    className={[
                      'checklist-step',
                      step.complete ? 'is-complete' : '',
                      index === currentStepIndex ? 'is-current' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {/* The numbered node leads the row so the connector line
                        between steps reads as one continuous track. */}
                    <span className="step-index" aria-hidden="true">
                      {step.complete ? <Icon name="check" size={11} /> : index + 1}
                    </span>
                    <input
                      id={checkboxId}
                      type="checkbox"
                      checked={step.complete}
                      disabled={readOnly}
                      style={{
                        width: 18,
                        height: 18,
                        marginTop: 2,
                        flex: 'none',
                        accentColor: 'var(--signal)',
                      }}
                      onChange={() => toggleStep(checklist.id, step.id)}
                    />

                    <div className="checklist-step-main">
                      {index === currentStepIndex ? (
                        <span className="checklist-step-current-flag">Current step</span>
                      ) : null}
                      <label className="checklist-step-label" htmlFor={checkboxId}>
                        {step.label}
                      </label>
                      {step.hint ? <p className="checklist-step-hint">{step.hint}</p> : null}

                      <div className="checklist-step-controls">
                        <label className="visually-hidden" htmlFor={`assignee-${step.id}`}>
                          Assign step: {step.label}
                        </label>
                        <select
                          id={`assignee-${step.id}`}
                          className="select"
                          value={step.assigneeId ?? ''}
                          disabled={readOnly}
                          onChange={(event) =>
                            updateStep(checklist.id, step.id, {
                              assigneeId: event.target.value || null,
                            })
                          }
                        >
                          <option value="">Unassigned</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>

                        <label className="visually-hidden" htmlFor={`note-${step.id}`}>
                          Note for step: {step.label}
                        </label>
                        <input
                          id={`note-${step.id}`}
                          className="input"
                          type="text"
                          value={step.note}
                          disabled={readOnly}
                          placeholder="Optional note"
                          onChange={(event) =>
                            updateStep(checklist.id, step.id, { note: event.target.value })
                          }
                        />
                      </div>

                      <div className="row row-wrap text-xs text-muted">
                        {assignee ? (
                          <>
                            <Avatar member={assignee} size="sm" showTitle={false} />
                            <span>{assignee.name}</span>
                          </>
                        ) : (
                          <span>No owner assigned</span>
                        )}
                        {step.completedAt ? (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Completed {formatDateTime(step.completedAt)}</span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this checklist?"
        message={`"${checklist.title}" and all of its step history will be removed from this browser.`}
        confirmLabel="Delete checklist"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
