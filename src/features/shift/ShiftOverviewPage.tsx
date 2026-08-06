import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import type { Task } from '@/types/domain'
import { useDemoStore } from '@/store/useDemoStore'
import {
  checklistProgress,
  findMember,
  memberLookup,
  sortTasks,
  summarizeChecklists,
  summarizeHandoffs,
  summarizeTasks,
  workloadByMember,
} from '@/store/selectors'
import { PageHeader, SafetyNote } from '@/components/layout/PageHeader'
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, CaseChip } from '@/components/ui/Badge'
import { Avatar, AvatarStack } from '@/components/ui/Avatar'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import {
  HANDOFF_STATUS_LABELS,
  HANDOFF_STATUS_TONES,
  SHIFT_STATUS_LABELS,
  SHIFT_STATUS_TONES,
  STATUS_LABELS,
  STATUS_TONES,
} from '@/lib/labels'
import { formatLongDate, formatRelative, formatTime } from '@/lib/time'
import { TaskCard } from '@/features/tasks/TaskCard'
import { TaskDetailDrawer } from '@/features/tasks/TaskDetailDrawer'
import { TaskFormDrawer } from '@/features/tasks/TaskFormDrawer'

/** Even divisions of the shift window, used as tick labels on the timeline. */
const TIMELINE_MARKS = 4

export function ShiftOverviewPage() {
  const members = useDemoStore((state) => state.members)
  const shifts = useDemoStore((state) => state.shifts)
  const tasks = useDemoStore((state) => state.tasks)
  const handoffs = useDemoStore((state) => state.handoffs)
  const checklists = useDemoStore((state) => state.checklists)
  const activity = useDemoStore((state) => state.activity)
  const activeShiftId = useDemoStore((state) => state.activeShiftId)

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const shift = shifts.find((item) => item.id === activeShiftId) ?? shifts[0]
  const lookup = useMemo(() => memberLookup(members), [members])

  const shiftTasks = useMemo(
    () => (shift ? tasks.filter((task) => task.shiftId === shift.id) : []),
    [tasks, shift],
  )
  const shiftChecklists = useMemo(
    () => (shift ? checklists.filter((item) => item.shiftId === shift.id) : []),
    [checklists, shift],
  )
  const shiftHandoffs = useMemo(
    () => (shift ? handoffs.filter((item) => item.shiftId === shift.id) : []),
    [handoffs, shift],
  )

  const summary = useMemo(() => summarizeTasks(shiftTasks), [shiftTasks])
  const docSummary = useMemo(() => summarizeChecklists(shiftChecklists), [shiftChecklists])
  const handoffSummary = useMemo(() => summarizeHandoffs(shiftHandoffs), [shiftHandoffs])
  const workload = useMemo(
    () => workloadByMember(members, shiftTasks, shiftChecklists),
    [members, shiftTasks, shiftChecklists],
  )

  const openTasks = useMemo(
    () => sortTasks(shiftTasks.filter((task) => task.status !== 'complete')).slice(0, 5),
    [shiftTasks],
  )
  const completedTasks = useMemo(
    () =>
      shiftTasks
        .filter((task) => task.status === 'complete')
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
        .slice(0, 4),
    [shiftTasks],
  )
  const awaitingHandoff = useMemo(
    () => shiftTasks.filter((task) => task.status === 'awaiting-handoff'),
    [shiftTasks],
  )
  const recentActivity = useMemo(() => activity.slice(0, 6), [activity])

  /** Position of "now" inside the scheduled shift window, as a percentage. */
  const elapsed = useMemo(() => {
    if (!shift) return 0
    const start = new Date(shift.startsAt).getTime()
    const end = new Date(shift.endsAt).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0
    return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100))
  }, [shift])

  const timelineMarks = useMemo(() => {
    if (!shift) return []
    const start = new Date(shift.startsAt).getTime()
    const end = new Date(shift.endsAt).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return []
    return Array.from({ length: TIMELINE_MARKS + 1 }, (_, index) =>
      formatTime(new Date(start + ((end - start) * index) / TIMELINE_MARKS).toISOString()),
    )
  }, [shift])

  const rosterMembers = shift
    ? shift.memberIds.map((id) => findMember(members, id)).filter((m) => !!m)
    : []

  const selectedTask = selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId) ?? null) : null
  const chargeNurse = shift ? findMember(members, shift.chargeMemberId) : null
  const busiest = workload.reduce((max, entry) => Math.max(max, entry.total), 0)

  if (!shift) {
    return (
      <div className="page">
        <Card>
          <CardBody>
            <EmptyState
              icon="clock"
              title="No shift data"
              body="Reset the demo data to restore the seeded shifts, team, and workflow items."
            />
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Shift overview"
        eyebrowIcon="gauge"
        title="Where the shift stands"
        description="A single place to see open administrative work, what is waiting on handoff, and how far documentation workflows have progressed."
        actions={
          <>
            <Link className="btn btn-secondary" to="/tasks">
              Open task board
            </Link>
            <Button
              variant="primary"
              icon="plus"
              onClick={() => {
                setEditingTask(null)
                setFormOpen(true)
              }}
            >
              New task
            </Button>
          </>
        }
      />

      {/* Command board: who is on, where the shift window sits, and the five
          administrative counts the charge nurse scans first. */}
      <section className="shift-hero" aria-labelledby="shift-hero-title">
        <div className="shift-hero-top">
          <div style={{ minWidth: 0 }}>
            <div className="row row-wrap" style={{ marginBottom: 'var(--space-2)' }}>
              <Badge tone={SHIFT_STATUS_TONES[shift.status]} dot>
                {SHIFT_STATUS_LABELS[shift.status]}
              </Badge>
              <span className="concept-tag">Fictional demo shift</span>
            </div>
            <h2 id="shift-hero-title">{shift.label}</h2>
            <p className="shift-hero-meta">
              {shift.unit} · {formatLongDate(shift.startsAt)} · {formatTime(shift.startsAt)}–
              {formatTime(shift.endsAt)}
            </p>
            {chargeNurse ? (
              <p className="shift-hero-meta" style={{ marginTop: 'var(--space-1)' }}>
                Charge: {chargeNurse.name}
              </p>
            ) : null}
          </div>
          <div className="spacer" />
          <div className="stack stack-2" style={{ alignItems: 'flex-end' }}>
            <AvatarStack members={rosterMembers} max={6} />
            <span className="eyebrow">{rosterMembers.length} on shift</span>
          </div>
        </div>

        <div className="shift-timeline">
          <div
            className="timeline-track"
            role="img"
            aria-label={`Shift window ${formatTime(shift.startsAt)} to ${formatTime(shift.endsAt)}, ${Math.round(elapsed)} percent elapsed`}
          >
            <span className="timeline-fill" style={{ width: `${elapsed}%` }} />
            {elapsed > 0 && elapsed < 100 ? (
              <span className="timeline-now" style={{ left: `${elapsed}%` }} />
            ) : null}
          </div>
          <div className="timeline-labels" aria-hidden="true">
            {timelineMarks.map((mark, index) => (
              <span key={`${mark}-${index}`}>{mark}</span>
            ))}
          </div>
        </div>

        <div className="shift-hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">{summary.total - summary.complete}</span>
            <span className="hero-stat-label">Open tasks</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value tone-success">{summary.complete}</span>
            <span className="hero-stat-label">Completed</span>
          </div>
          <div className="hero-stat">
            <span
              className={`hero-stat-value ${summary.awaitingHandoff > 0 ? 'tone-accent' : ''}`.trim()}
            >
              {summary.awaitingHandoff}
            </span>
            <span className="hero-stat-label">Awaiting handoff</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">{docSummary.percent}%</span>
            <span className="hero-stat-label">Documentation complete</span>
          </div>
          <div className="hero-stat">
            <span className={`hero-stat-value ${summary.overdue > 0 ? 'tone-warn' : ''}`.trim()}>
              {summary.overdue}
            </span>
            <span className="hero-stat-label">Past due</span>
          </div>
        </div>
      </section>

      <SafetyNote />

      <div className="grid-sidebar">
        <div className="stack stack-5">
          <Card>
            <CardHeader
              headingLevel={2}
              title="Open tasks"
              subtitle="Sorted by due time, then by the priority you set."
              actions={
                <Link className="btn btn-ghost btn-sm" to="/tasks">
                  View all
                </Link>
              }
            />
            <CardBody>
              {openTasks.length === 0 ? (
                <EmptyState
                  icon="checkCircle"
                  title="Nothing open on this shift"
                  body="Every administrative task on this shift has been completed."
                />
              ) : (
                <ul className="task-list">
                  {openTasks.map((task) => (
                    <li key={task.id}>
                      <TaskCard
                        task={task}
                        assignee={task.assigneeId ? (lookup.get(task.assigneeId) ?? null) : null}
                        onOpen={(t) => setSelectedTaskId(t.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <div className="grid-2">
            <Card>
              <CardHeader
                headingLevel={2}
                title="Awaiting handoff"
                subtitle={`${awaitingHandoff.length} item${awaitingHandoff.length === 1 ? '' : 's'} flagged for the next shift`}
              />
              <CardBody flush>
                {awaitingHandoff.length === 0 ? (
                  <div className="card-pad">
                    <EmptyState
                      icon="handoff"
                      title="Nothing waiting"
                      body="Move a task to “Awaiting handoff” to flag it for the incoming team."
                    />
                  </div>
                ) : (
                  <ul className="handoff-list">
                    {awaitingHandoff.map((task) => (
                      <li key={task.id}>
                        <button
                          type="button"
                          className="handoff-item"
                          onClick={() => setSelectedTaskId(task.id)}
                        >
                          <span className="handoff-item-title">{task.title}</span>
                          <span className="row row-wrap">
                            <Badge tone={STATUS_TONES[task.status]}>
                              {STATUS_LABELS[task.status]}
                            </Badge>
                            {task.caseLabel ? <CaseChip label={task.caseLabel} /> : null}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
              <CardFooter>
                <Link className="btn btn-secondary btn-sm" to="/handoff">
                  Open handoff builder
                </Link>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader
                headingLevel={2}
                title="Recently completed"
                subtitle="The last few items closed on this shift."
              />
              <CardBody>
                {completedTasks.length === 0 ? (
                  <EmptyState
                    icon="check"
                    title="Nothing completed yet"
                    body="Completed tasks and the time they closed will be listed here."
                  />
                ) : (
                  <ul className="pulse-list">
                    {completedTasks.map((task) => (
                      <li className="pulse-item" key={task.id}>
                        <span className="activity-marker tone-success">
                          <Icon name="check" size={12} />
                        </span>
                        <span style={{ minWidth: 0 }}>
                          <span className="text-sm" style={{ fontWeight: 580, display: 'block' }}>
                            {task.title}
                          </span>
                          <span className="pulse-time" style={{ display: 'block' }}>
                            {task.completedAt ? formatRelative(task.completedAt) : 'Complete'}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              headingLevel={2}
              title="Documentation completion"
              subtitle={`${docSummary.completedSteps} of ${docSummary.steps} checklist steps complete on this shift`}
              actions={
                <Link className="btn btn-ghost btn-sm" to="/checklists">
                  All checklists
                </Link>
              }
            />
            <CardBody className="stack stack-5">
              {shiftChecklists.length === 0 ? (
                <EmptyState
                  icon="checklist"
                  title="No checklists on this shift"
                  body="Start one from a workflow template to track documentation progress."
                />
              ) : (
                shiftChecklists.map((checklist) => {
                  const progress = checklistProgress(checklist)
                  return (
                    <div className="stack stack-2" key={checklist.id}>
                      <div className="row row-wrap">
                        <Link
                          to={`/checklists/${checklist.id}`}
                          className="text-sm"
                          style={{ fontWeight: 620, textDecoration: 'none', color: 'var(--ink)' }}
                        >
                          {checklist.title}
                        </Link>
                        <div className="spacer" />
                        {checklist.caseLabel ? <CaseChip label={checklist.caseLabel} /> : null}
                      </div>
                      <Progress
                        label={`${checklist.title} progress`}
                        value={progress.completed}
                        max={progress.total}
                        showMeta
                        metaLeft={`${progress.completed} of ${progress.total} steps`}
                        size="sm"
                      />
                    </div>
                  )
                })
              )}
            </CardBody>
          </Card>
        </div>

        <div className="stack stack-5">
          {/* Allocation readout: each person's share of the shift's open work. */}
          <Card>
            <CardHeader
              headingLevel={2}
              title="Team on shift"
              subtitle="Assigned open work per person."
            />
            <CardBody flush>
              <ul className="roster-list">
                {rosterMembers.map((member) => {
                  const entry = workload.find((item) => item.member.id === member.id)
                  const open = entry ? entry.total - entry.complete : 0
                  const share = busiest > 0 ? Math.round((open / busiest) * 100) : 0
                  return (
                    <li className="roster-item" key={member.id}>
                      <Avatar member={member} showTitle={false} />
                      <span style={{ minWidth: 0 }}>
                        <span className="roster-name truncate" style={{ display: 'block' }}>
                          {member.name}
                        </span>
                        <span className="roster-role truncate" style={{ display: 'block' }}>
                          {member.role}
                        </span>
                      </span>
                      <span className="roster-load">
                        <span className="meter-track" style={{ width: 54 }} aria-hidden="true">
                          <span className="meter-fill meter-fill-open" style={{ width: `${share}%` }} />
                        </span>
                        <span>{open} open</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
            </CardBody>
            <CardFooter>
              <Link className="btn btn-secondary btn-sm" to="/team">
                Full workload view
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader
              headingLevel={2}
              title="Handoff status"
              subtitle={`${handoffSummary.handedOff} of ${handoffSummary.total} records handed off`}
            />
            <CardBody className="stack stack-3">
              {shiftHandoffs.length === 0 ? (
                <EmptyState
                  icon="handoff"
                  title="No handoff records"
                  body="Create a structured handoff draft for this shift."
                />
              ) : (
                shiftHandoffs.map((record) => (
                  <div className="row row-wrap" key={record.id}>
                    <Badge tone={HANDOFF_STATUS_TONES[record.status]} dot>
                      {HANDOFF_STATUS_LABELS[record.status]}
                    </Badge>
                    <span className="text-sm truncate" style={{ minWidth: 0, flex: 1 }}>
                      {record.title}
                    </span>
                  </div>
                ))
              )}
            </CardBody>
            <CardFooter>
              <Link className="btn btn-secondary btn-sm" to="/handoff">
                Open handoff builder
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader headingLevel={2} title="Recent activity" subtitle="Newest changes first." />
            <CardBody>
              {recentActivity.length === 0 ? (
                <EmptyState
                  icon="activity"
                  title="No activity yet"
                  body="Workflow changes appear here as soon as they happen."
                />
              ) : (
                <ul className="pulse-list">
                  {recentActivity.map((event) => (
                    <li className="pulse-item" key={event.id}>
                      <span className="activity-marker">
                        <Icon name="spark" size={11} />
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span className="activity-summary" style={{ display: 'block' }}>
                          {event.summary}
                        </span>
                        <span className="pulse-time" style={{ display: 'block' }}>
                          {formatRelative(event.at)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
            <CardFooter>
              <Link className="btn btn-secondary btn-sm" to="/activity">
                Full activity history
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>

      <TaskFormDrawer open={formOpen} onClose={() => setFormOpen(false)} task={editingTask} />

      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onEdit={(task) => {
          setSelectedTaskId(null)
          setEditingTask(task)
          setFormOpen(true)
        }}
      />
    </div>
  )
}
