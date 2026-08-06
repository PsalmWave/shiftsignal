import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import type { ChecklistStatus } from '@/types/domain'
import { useDemoStore } from '@/store/useDemoStore'
import { checklistProgress, summarizeChecklists } from '@/store/selectors'
import { PageHeader, SafetyNote } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, CaseChip } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { SelectField, TextInput } from '@/components/ui/Form'
import { StatTile } from '@/components/ui/StatTile'
import { useToast } from '@/components/ui/Toast'
import {
  CHECKLIST_STATUS_LABELS,
  CHECKLIST_STATUS_TONES,
  WORKFLOW_LABELS,
} from '@/lib/labels'
import { caseOptions } from '@/features/tasks/options'
import { formatRelative } from '@/lib/time'

type StatusFilter = ChecklistStatus | 'all'

export function ChecklistsPage() {
  const checklists = useDemoStore((state) => state.checklists)
  const templates = useDemoStore((state) => state.templates)
  const createChecklist = useDemoStore((state) => state.createChecklistFromTemplate)
  const { notify } = useToast()

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [caseLabel, setCaseLabel] = useState('')
  const [titleError, setTitleError] = useState<string | undefined>()

  const summary = summarizeChecklists(checklists)

  const visible = useMemo(() => {
    const filtered =
      statusFilter === 'all'
        ? checklists
        : checklists.filter((checklist) => checklist.status === statusFilter)
    return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [checklists, statusFilter])

  const openCreate = () => {
    setTemplateId(templates[0]?.id ?? '')
    setTitle('')
    setCaseLabel('')
    setTitleError(undefined)
    setCreateOpen(true)
  }

  const handleCreate = () => {
    const trimmed = title.trim()
    if (trimmed.length < 3) {
      setTitleError('Give this checklist a title with at least 3 characters.')
      return
    }
    const created = createChecklist(templateId, { title: trimmed, caseLabel: caseLabel || null })
    if (!created) {
      notify('Select a workflow template first.', 'warn')
      return
    }
    setCreateOpen(false)
    notify(`Checklist started from "${created.templateName}".`, 'success')
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Documentation"
        eyebrowIcon="checklist"
        title="Workflow checklists"
        description="Running checklists built from unit workflow templates. Each step tracks who owns it, an optional note, and when it was completed."
        actions={
          <Button variant="primary" icon="plus" onClick={openCreate} disabled={templates.length === 0}>
            New checklist
          </Button>
        }
      />

      <SafetyNote>
        <strong>Workflow tracking, not documentation of record.</strong> These checklists confirm
        that administrative steps happened. Clinical documentation belongs in your
        institution&apos;s approved system.
      </SafetyNote>

      <div className="stat-grid">
        <StatTile label="Checklists" value={summary.checklists} icon="checklist" />
        <StatTile label="Active" value={summary.active} icon="clock" />
        <StatTile label="Complete" value={summary.complete} icon="checkCircle" />
        <StatTile
          label="Step completion"
          value={`${summary.percent}%`}
          hint={`${summary.completedSteps} of ${summary.steps} steps`}
          icon="gauge"
        />
      </div>

      <div className="row row-wrap">
        <div className="segmented" role="group" aria-label="Filter checklists by status">
          {(['all', 'active', 'complete', 'archived'] as StatusFilter[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={statusFilter === value}
              onClick={() => setStatusFilter(value)}
            >
              {value === 'all' ? 'All' : CHECKLIST_STATUS_LABELS[value]}
            </button>
          ))}
        </div>
        <span className="eyebrow" role="status" aria-live="polite">
          {visible.length} shown
        </span>
      </div>

      {visible.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="checklist"
              title={checklists.length === 0 ? 'No checklists yet' : 'Nothing in this view'}
              body={
                checklists.length === 0
                  ? 'Start a checklist from one of the workflow templates to track a repeatable process.'
                  : 'Switch the status filter to see checklists in another state.'
              }
              action={
                checklists.length === 0 ? (
                  <Button variant="primary" icon="plus" onClick={openCreate}>
                    New checklist
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setStatusFilter('all')}>
                    Show all checklists
                  </Button>
                )
              }
            />
          </CardBody>
        </Card>
      ) : (
        // Procedure board: every running workflow with its own step track.
        <div className="checklist-grid">
          {visible.map((checklist) => {
            const progress = checklistProgress(checklist)
            return (
              <article className="checklist-row" data-status={checklist.status} key={checklist.id}>
                <div className="checklist-row-top">
                  <div style={{ minWidth: 0 }}>
                    <h2 className="checklist-row-title">
                      <Link to={`/checklists/${checklist.id}`}>{checklist.title}</Link>
                    </h2>
                    <p className="checklist-row-meta">
                      {WORKFLOW_LABELS[checklist.kind]} · updated{' '}
                      {formatRelative(checklist.updatedAt)}
                    </p>
                  </div>
                  <div className="spacer" />
                  <div className="row row-wrap" style={{ justifyContent: 'flex-end' }}>
                    <Badge tone={CHECKLIST_STATUS_TONES[checklist.status]} dot>
                      {CHECKLIST_STATUS_LABELS[checklist.status]}
                    </Badge>
                    {checklist.caseLabel ? <CaseChip label={checklist.caseLabel} /> : null}
                  </div>
                </div>

                <Progress
                  label={`${checklist.title} progress`}
                  value={progress.completed}
                  max={progress.total}
                  showMeta
                  metaLeft={`${progress.completed} of ${progress.total} steps`}
                />

                <div className="checklist-row-foot">
                  <span className="eyebrow">
                    {progress.total - progress.completed} remaining
                  </span>
                  <div className="spacer" />
                  <Link className="btn btn-secondary btn-sm" to={`/checklists/${checklist.id}`}>
                    Open track
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Start a checklist"
        description="Only enabled template steps are copied into the new checklist."
        footer={
          <>
            <div className="spacer" />
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon="check" onClick={handleCreate}>
              Start checklist
            </Button>
          </>
        }
      >
        <div className="stack stack-4">
          <SelectField
            label="Workflow template"
            options={templates.map((template) => ({
              value: template.id,
              label: `${template.name} · ${template.steps.filter((s) => s.enabled).length} steps`,
            }))}
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
          />
          <TextInput
            label="Checklist title"
            required
            value={title}
            error={titleError}
            placeholder="e.g. Admission workflow — Demo Case B"
            onChange={(event) => {
              setTitle(event.target.value)
              if (titleError) setTitleError(undefined)
            }}
          />
          <SelectField
            label="Case reference"
            options={caseOptions}
            help="Non-identifying demo labels only."
            value={caseLabel}
            onChange={(event) => setCaseLabel(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
