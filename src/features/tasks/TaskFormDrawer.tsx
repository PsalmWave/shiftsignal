import { useEffect, useState, type FormEvent } from 'react'

import type { Task, TaskCategory, TaskDraft, TaskPriority, TaskStatus } from '@/types/domain'
import { useDemoStore } from '@/store/useDemoStore'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { SelectField, TextArea, TextInput } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { fromLocalInputValue, toLocalInputValue } from '@/lib/time'
import { assigneeOptions, caseOptions, categoryOptions, priorityOptions, statusOptions } from './options'

export interface TaskFormDrawerProps {
  open: boolean
  onClose: () => void
  /** When provided the drawer edits that task; otherwise it creates a new one. */
  task?: Task | null
}

interface FormState {
  title: string
  description: string
  category: TaskCategory
  priority: TaskPriority
  status: TaskStatus
  assigneeId: string
  caseLabel: string
  dueAt: string
}

const emptyForm: FormState = {
  title: '',
  description: '',
  category: 'administrative',
  priority: 'normal',
  status: 'open',
  assigneeId: '',
  caseLabel: '',
  dueAt: '',
}

function toFormState(task: Task | null | undefined): FormState {
  if (!task) return { ...emptyForm }
  return {
    title: task.title,
    description: task.description,
    category: task.category,
    priority: task.priority,
    status: task.status,
    assigneeId: task.assigneeId ?? '',
    caseLabel: task.caseLabel ?? '',
    dueAt: toLocalInputValue(task.dueAt),
  }
}

export function TaskFormDrawer({ open, onClose, task = null }: TaskFormDrawerProps) {
  const members = useDemoStore((state) => state.members)
  const createTask = useDemoStore((state) => state.createTask)
  const updateTask = useDemoStore((state) => state.updateTask)
  const { notify } = useToast()

  const [form, setForm] = useState<FormState>(() => toFormState(task))
  const [titleError, setTitleError] = useState<string | undefined>()

  // Re-seed the form whenever the drawer opens or targets a different task.
  useEffect(() => {
    if (open) {
      setForm(toFormState(task))
      setTitleError(undefined)
    }
  }, [open, task])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = (event: Pick<FormEvent, 'preventDefault'>) => {
    event.preventDefault()

    const title = form.title.trim()
    if (title.length < 3) {
      setTitleError('Enter a task title with at least 3 characters.')
      return
    }

    const draft: TaskDraft = {
      title,
      description: form.description,
      category: form.category,
      priority: form.priority,
      status: form.status,
      assigneeId: form.assigneeId || null,
      caseLabel: form.caseLabel || null,
      dueAt: fromLocalInputValue(form.dueAt),
    }

    if (task) {
      updateTask(task.id, draft)
      notify('Task updated.', 'success')
    } else {
      createTask(draft)
      notify('Task added to the board.', 'success')
    }
    onClose()
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      eyebrow={task ? 'Edit task' : 'New task'}
      title={task ? task.title : 'Create a workflow task'}
      footer={
        <>
          <div className="spacer" />
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="check" onClick={handleSubmit}>
            {task ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id="task-form" className="stack stack-5" onSubmit={handleSubmit} noValidate>
        <TextInput
          label="Task title"
          required
          value={form.title}
          error={titleError}
          placeholder="e.g. Confirm transport scheduling for Demo Case A"
          onChange={(event) => {
            set('title', event.target.value)
            if (titleError) setTitleError(undefined)
          }}
        />

        <TextArea
          label="Details"
          value={form.description}
          placeholder="What has already happened, and what does the next person need to know?"
          help="Administrative context only. Do not enter patient identifiers or clinical information."
          onChange={(event) => set('description', event.target.value)}
        />

        <div className="form-grid">
          <SelectField
            label="Category"
            options={categoryOptions}
            value={form.category}
            onChange={(event) => set('category', event.target.value as TaskCategory)}
          />
          <SelectField
            label="Priority"
            options={priorityOptions}
            help="Chosen by you for ordering. Not a clinical urgency score."
            value={form.priority}
            onChange={(event) => set('priority', event.target.value as TaskPriority)}
          />
          <SelectField
            label="Status"
            options={statusOptions}
            value={form.status}
            onChange={(event) => set('status', event.target.value as TaskStatus)}
          />
          <SelectField
            label="Assigned to"
            options={assigneeOptions(members)}
            value={form.assigneeId}
            onChange={(event) => set('assigneeId', event.target.value)}
          />
          <SelectField
            label="Case reference"
            options={caseOptions}
            help="Non-identifying demo labels only."
            value={form.caseLabel}
            onChange={(event) => set('caseLabel', event.target.value)}
          />
          <TextInput
            label="Due"
            type="datetime-local"
            value={form.dueAt}
            onChange={(event) => set('dueAt', event.target.value)}
          />
        </div>
      </form>
    </Drawer>
  )
}
