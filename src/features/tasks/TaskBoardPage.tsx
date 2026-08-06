import { useMemo, useState } from 'react'

import type { Task, TaskCategory, TaskPriority, TaskStatus } from '@/types/domain'
import { useDemoStore } from '@/store/useDemoStore'
import {
  countActiveFilters,
  DEFAULT_TASK_FILTERS,
  filterTasks,
  memberLookup,
  sortTasks,
  summarizeTasks,
  type TaskFilters,
} from '@/store/selectors'
import { PageHeader, SafetyNote } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchInput, SelectField } from '@/components/ui/Form'
import { Badge } from '@/components/ui/Badge'
import { BOARD_COLUMNS, STATUS_LABELS } from '@/lib/labels'
import { TaskCard } from './TaskCard'
import { TaskFormDrawer } from './TaskFormDrawer'
import { TaskDetailDrawer } from './TaskDetailDrawer'
import {
  assigneeOptions,
  categoryOptions,
  priorityOptions,
  statusOptions,
  withAll,
} from './options'

type ViewMode = 'board' | 'list'

export function TaskBoardPage() {
  const tasks = useDemoStore((state) => state.tasks)
  const members = useDemoStore((state) => state.members)
  const shifts = useDemoStore((state) => state.shifts)

  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_TASK_FILTERS)
  const [view, setView] = useState<ViewMode>('board')
  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const lookup = useMemo(() => memberLookup(members), [members])
  const visible = useMemo(
    () => sortTasks(filterTasks(tasks, filters, members)),
    [tasks, filters, members],
  )
  const summary = useMemo(() => summarizeTasks(visible), [visible])
  const activeFilterCount = countActiveFilters(filters)

  const selectedTask = selectedTaskId ? (tasks.find((t) => t.id === selectedTaskId) ?? null) : null

  const set = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }))

  const shiftOptions = withAll(
    shifts.map((shift) => ({ value: shift.id, label: shift.label })),
    'All shifts',
  )

  const openCreate = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const openEdit = (task: Task) => {
    setSelectedTaskId(null)
    setEditingTask(task)
    setFormOpen(true)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Task board"
        eyebrowIcon="board"
        title="Workflow tasks"
        description="Every open administrative item on the unit, grouped by where it stands. Priority is a coordination label you choose — it is not a clinical urgency rating."
        actions={
          <>
            <div className="segmented" role="group" aria-label="Task view">
              <button type="button" aria-pressed={view === 'board'} onClick={() => setView('board')}>
                Board
              </button>
              <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
                List
              </button>
            </div>
            <Button variant="primary" icon="plus" onClick={openCreate}>
              New task
            </Button>
          </>
        }
      />

      <SafetyNote />

      <Card>
        <div className="filter-bar">
          <SearchInput
            label="Search tasks"
            value={filters.search}
            onChange={(value) => set('search', value)}
            placeholder="Search titles, details, notes, or people"
          />
          <SelectField
            label="Category"
            options={withAll(categoryOptions, 'All categories')}
            value={filters.category}
            onChange={(event) => set('category', event.target.value as TaskCategory | 'all')}
          />
          <SelectField
            label="Status"
            options={withAll(statusOptions, 'All statuses')}
            value={filters.status}
            onChange={(event) => set('status', event.target.value as TaskStatus | 'all')}
          />
          <SelectField
            label="Priority"
            options={withAll(priorityOptions, 'Any priority')}
            value={filters.priority}
            onChange={(event) => set('priority', event.target.value as TaskPriority | 'all')}
          />
          <SelectField
            label="Assignee"
            options={[
              { value: 'all', label: 'Anyone' },
              { value: 'unassigned', label: 'Unassigned' },
              ...assigneeOptions(members).slice(1),
            ]}
            value={filters.assigneeId}
            onChange={(event) => set('assigneeId', event.target.value)}
          />
          <SelectField
            label="Shift"
            options={shiftOptions}
            value={filters.shiftId}
            onChange={(event) => set('shiftId', event.target.value)}
          />
          {activeFilterCount > 0 ? (
            <Button
              variant="ghost"
              icon="close"
              onClick={() => setFilters(DEFAULT_TASK_FILTERS)}
              style={{ marginBottom: 1 }}
            >
              Clear {activeFilterCount}
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="status-strip" role="status" aria-live="polite">
        <span>
          Showing <strong>{visible.length}</strong> of {tasks.length} tasks
        </span>
        <Badge tone="neutral">{summary.open + summary.inProgress} active</Badge>
        {summary.blocked > 0 ? <Badge tone="warn">{summary.blocked} blocked</Badge> : null}
        {summary.awaitingHandoff > 0 ? (
          <Badge tone="accent">{summary.awaitingHandoff} awaiting handoff</Badge>
        ) : null}
        {summary.overdue > 0 ? <Badge tone="warn">{summary.overdue} past due</Badge> : null}
        {summary.unassigned > 0 ? (
          <Badge tone="neutral">{summary.unassigned} unassigned</Badge>
        ) : null}
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="search"
              title={tasks.length === 0 ? 'No tasks yet' : 'No tasks match these filters'}
              body={
                tasks.length === 0
                  ? 'Create the first workflow task to see it appear on the board.'
                  : 'Try clearing a filter or broadening your search to see more of the board.'
              }
              action={
                tasks.length === 0 ? (
                  <Button variant="primary" icon="plus" onClick={openCreate}>
                    New task
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setFilters(DEFAULT_TASK_FILTERS)}>
                    Clear all filters
                  </Button>
                )
              }
            />
          </CardBody>
        </Card>
      ) : view === 'board' ? (
        <div className="board">
          {BOARD_COLUMNS.map((status) => {
            const columnTasks = visible.filter((task) => task.status === status)
            return (
              <section
                key={status}
                className="board-column"
                data-status={status}
                aria-label={`${STATUS_LABELS[status]} (${columnTasks.length})`}
              >
                <header className="board-column-header">
                  <span className="board-column-dot" aria-hidden="true" />
                  <span className="board-column-title">{STATUS_LABELS[status]}</span>
                  <span className="board-column-count">{columnTasks.length}</span>
                </header>
                <div className="board-column-body">
                  {columnTasks.length === 0 ? (
                    <p className="board-empty">Nothing here right now.</p>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        assignee={task.assigneeId ? (lookup.get(task.assigneeId) ?? null) : null}
                        onOpen={(t) => setSelectedTaskId(t.id)}
                      />
                    ))
                  )}
                </div>
              </section>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardBody>
            <ul className="task-list">
              {visible.map((task) => (
                <li key={task.id}>
                  <TaskCard
                    task={task}
                    assignee={task.assigneeId ? (lookup.get(task.assigneeId) ?? null) : null}
                    onOpen={(t) => setSelectedTaskId(t.id)}
                    showDate
                  />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <TaskFormDrawer open={formOpen} onClose={() => setFormOpen(false)} task={editingTask} />

      <TaskDetailDrawer
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onEdit={openEdit}
      />
    </div>
  )
}
