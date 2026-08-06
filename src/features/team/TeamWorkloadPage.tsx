import { useMemo } from 'react'

import { useDemoStore } from '@/store/useDemoStore'
import {
  countByCategory,
  summarizeChecklists,
  summarizeHandoffs,
  summarizeTasks,
  workloadByMember,
} from '@/store/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { StatTile } from '@/components/ui/StatTile'
import { EmptyState } from '@/components/ui/EmptyState'
import { Icon } from '@/components/ui/Icon'
import { CATEGORY_LABELS, WORKFLOW_LABELS } from '@/lib/labels'
import { checklistProgress } from '@/store/selectors'

export function TeamWorkloadPage() {
  const members = useDemoStore((state) => state.members)
  const tasks = useDemoStore((state) => state.tasks)
  const checklists = useDemoStore((state) => state.checklists)
  const handoffs = useDemoStore((state) => state.handoffs)

  const taskSummary = useMemo(() => summarizeTasks(tasks), [tasks])
  const categories = useMemo(() => countByCategory(tasks), [tasks])
  const workload = useMemo(
    () => workloadByMember(members, tasks, checklists),
    [members, tasks, checklists],
  )
  const docSummary = useMemo(() => summarizeChecklists(checklists), [checklists])
  const handoffSummary = useMemo(() => summarizeHandoffs(handoffs), [handoffs])

  const maxCategory = Math.max(1, ...categories.map((entry) => entry.total))
  const maxWorkload = Math.max(1, ...workload.map((entry) => entry.total))
  const activeChecklists = checklists.filter((checklist) => checklist.status !== 'archived')

  return (
    <div className="page">
      <PageHeader
        eyebrow="Team & workload"
        eyebrowIcon="team"
        title="Operational summary"
        description="Where the administrative work sits across the team. These are workload and completion counts only — no acuity scores, no patient outcome predictions, no clinical risk modelling."
      />

      <div className="callout callout-info">
        <Icon name="info" size={16} />
        <span>
          Every number below counts workflow items in this browser. Nothing here evaluates people or
          patients.
        </span>
      </div>

      <div className="stat-grid">
        <StatTile
          label="Task completion"
          value={`${taskSummary.completionRate}%`}
          hint={`${taskSummary.complete} of ${taskSummary.total} tasks complete`}
          icon="checkCircle"
        />
        <StatTile
          label="Open work items"
          value={taskSummary.total - taskSummary.complete}
          hint={`${taskSummary.blocked} blocked · ${taskSummary.awaitingHandoff} awaiting handoff`}
          icon="board"
        />
        <StatTile
          label="Documentation progress"
          value={`${docSummary.percent}%`}
          hint={`${docSummary.completedSteps} of ${docSummary.steps} checklist steps`}
          icon="checklist"
        />
        <StatTile
          label="Handoff completion"
          value={`${handoffSummary.percent}%`}
          hint={`${handoffSummary.handedOff} of ${handoffSummary.total} records handed off`}
          icon="handoff"
        />
      </div>

      <div className="grid-2">
        <Card>
          <CardHeader
            headingLevel={2}
            title="Open tasks by category"
            subtitle="Where the administrative load is concentrated."
          />
          <CardBody className="stack stack-5">
            <div className="meter-list">
              {categories.map((entry) => (
                <div className="meter-row" key={entry.category}>
                  <span className="meter-name">{CATEGORY_LABELS[entry.category]}</span>
                  <div
                    className="meter-track"
                    role="img"
                    aria-label={`${CATEGORY_LABELS[entry.category]}: ${entry.open} open, ${entry.complete} complete`}
                  >
                    <div
                      className="meter-fill meter-fill-open"
                      style={{ width: `${(entry.open / maxCategory) * 100}%` }}
                    />
                    <div
                      className="meter-fill meter-fill-complete"
                      style={{ width: `${(entry.complete / maxCategory) * 100}%` }}
                    />
                  </div>
                  <span className="meter-value">
                    {entry.open}
                    <span className="text-muted"> / {entry.total}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="legend">
              <span className="legend-key">
                <span className="legend-swatch" style={{ background: 'var(--azure)' }} />
                Open
              </span>
              <span className="legend-key">
                <span className="legend-swatch" style={{ background: 'var(--signal)' }} />
                Complete
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Allocation board: one panel per person, showing the share of the
            shift's work they hold and how it breaks down. */}
        <Card>
          <CardHeader
            headingLevel={2}
            title="Shift allocation"
            subtitle="Assigned tasks across every shift in the demo dataset."
          />
          <CardBody>
            <div className="alloc-grid">
              {workload.map((entry) => (
                <div className="alloc-card" key={entry.member.id}>
                  <div className="alloc-head">
                    <Avatar member={entry.member} size="sm" showTitle={false} />
                    <span style={{ minWidth: 0 }}>
                      <span className="alloc-name truncate" style={{ display: 'block' }}>
                        {entry.member.name}
                      </span>
                      <span className="alloc-focus truncate" style={{ display: 'block' }}>
                        {entry.member.focus}
                      </span>
                    </span>
                  </div>

                  <div
                    className="meter-track"
                    role="img"
                    aria-label={`${entry.member.name}: ${entry.total - entry.complete} open, ${entry.complete} complete`}
                  >
                    <div
                      className="meter-fill meter-fill-open"
                      style={{ width: `${((entry.total - entry.complete) / maxWorkload) * 100}%` }}
                    />
                    <div
                      className="meter-fill meter-fill-complete"
                      style={{ width: `${(entry.complete / maxWorkload) * 100}%` }}
                    />
                  </div>

                  <div className="alloc-counts">
                    <div className="alloc-cell">
                      <span className="alloc-cell-value">{entry.total}</span>
                      <span className="alloc-cell-label">All</span>
                    </div>
                    <div className={`alloc-cell ${entry.blocked > 0 ? 'is-alert' : ''}`.trim()}>
                      <span className="alloc-cell-value">{entry.blocked}</span>
                      <span className="alloc-cell-label">Blocked</span>
                    </div>
                    <div
                      className={`alloc-cell ${entry.awaitingHandoff > 0 ? 'is-wait' : ''}`.trim()}
                    >
                      <span className="alloc-cell-value">{entry.awaitingHandoff}</span>
                      <span className="alloc-cell-label">Waiting</span>
                    </div>
                    <div className={`alloc-cell ${entry.complete > 0 ? 'is-done' : ''}`.trim()}>
                      <span className="alloc-cell-value">{entry.complete}</span>
                      <span className="alloc-cell-label">Done</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          headingLevel={2}
          title="Team roster"
          subtitle="Assignments, blockers, and outstanding checklist steps per person."
        />
        <CardBody flush>
          <div className="table-wrap">
            <table className="table">
              <caption className="visually-hidden">
                Workload by team member: assigned tasks, open items, blocked items, awaiting handoff,
                past due, open checklist steps, and completion rate.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Team member</th>
                  <th scope="col">Role</th>
                  <th scope="col" className="num">
                    Assigned
                  </th>
                  <th scope="col" className="num">
                    Open
                  </th>
                  <th scope="col" className="num">
                    Blocked
                  </th>
                  <th scope="col" className="num">
                    Awaiting handoff
                  </th>
                  <th scope="col" className="num">
                    Past due
                  </th>
                  <th scope="col" className="num">
                    Checklist steps
                  </th>
                  <th scope="col" className="num">
                    Complete
                  </th>
                </tr>
              </thead>
              <tbody>
                {workload.map((entry) => (
                  <tr key={entry.member.id}>
                    <th scope="row">
                      <span className="row">
                        <Avatar member={entry.member} size="sm" showTitle={false} />
                        <span style={{ minWidth: 0 }}>
                          <span style={{ display: 'block', fontWeight: 620, color: 'var(--ink)' }}>
                            {entry.member.name}
                          </span>
                          <span className="alloc-focus">{entry.member.focus}</span>
                        </span>
                      </span>
                    </th>
                    <td>{entry.member.role}</td>
                    <td className="num">{entry.total}</td>
                    <td className="num">{entry.open + entry.inProgress}</td>
                    <td className="num">
                      {entry.blocked > 0 ? (
                        <Badge tone="warn">{entry.blocked}</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="num">
                      {entry.awaitingHandoff > 0 ? (
                        <Badge tone="accent">{entry.awaitingHandoff}</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="num">
                      {entry.overdue > 0 ? (
                        <Badge tone="warn">{entry.overdue}</Badge>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td className="num">{entry.checklistSteps}</td>
                    <td className="num">{entry.completionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          headingLevel={2}
          title="Documentation checklist progress"
          subtitle="Every non-archived checklist and how far along it is."
        />
        <CardBody className="stack stack-5">
          {activeChecklists.length === 0 ? (
            <EmptyState
              icon="checklist"
              title="No checklists in progress"
              body="Start a checklist from a workflow template to track documentation progress here."
            />
          ) : (
            activeChecklists.map((checklist) => {
              const progress = checklistProgress(checklist)
              return (
                <div className="stack stack-2" key={checklist.id}>
                  <div className="row row-wrap">
                    <span className="text-sm" style={{ fontWeight: 620 }}>
                      {checklist.title}
                    </span>
                    <Badge tone="neutral">{WORKFLOW_LABELS[checklist.kind]}</Badge>
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
  )
}
