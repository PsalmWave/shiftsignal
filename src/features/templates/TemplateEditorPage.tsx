import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import type { TeamRole, WorkflowKind } from '@/types/domain'
import { TEAM_ROLES, WORKFLOW_KINDS } from '@/types/domain'
import { useDemoStore } from '@/store/useDemoStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { SelectField, TextArea, TextInput } from '@/components/ui/Form'
import { useToast } from '@/components/ui/Toast'
import { WORKFLOW_LABELS } from '@/lib/labels'
import { caseOptions } from '@/features/tasks/options'

export function TemplateEditorPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const { notify } = useToast()

  const templates = useDemoStore((state) => state.templates)
  const updateMeta = useDemoStore((state) => state.updateTemplateMeta)
  const addStep = useDemoStore((state) => state.addTemplateStep)
  const updateStep = useDemoStore((state) => state.updateTemplateStep)
  const removeStep = useDemoStore((state) => state.removeTemplateStep)
  const moveStep = useDemoStore((state) => state.moveTemplateStep)
  const duplicateTemplate = useDemoStore((state) => state.duplicateTemplate)
  const deleteTemplate = useDemoStore((state) => state.deleteTemplate)
  const createChecklist = useDemoStore((state) => state.createChecklistFromTemplate)

  const [newStepLabel, setNewStepLabel] = useState('')
  const [stepError, setStepError] = useState<string | undefined>()
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [checklistTitle, setChecklistTitle] = useState('')
  const [checklistCase, setChecklistCase] = useState('')
  const [checklistError, setChecklistError] = useState<string | undefined>()

  const template = templates.find((item) => item.id === templateId)

  if (!template) {
    return (
      <div className="page">
        <Card>
          <CardBody>
            <EmptyState
              icon="templates"
              title="Template not found"
              body="This template may have been deleted, or the demo data was reset in this browser."
              action={
                <Link className="btn btn-primary" to="/templates">
                  Back to templates
                </Link>
              }
            />
          </CardBody>
        </Card>
      </div>
    )
  }

  const enabledSteps = template.steps.filter((step) => step.enabled)

  const handleAddStep = () => {
    const trimmed = newStepLabel.trim()
    if (trimmed.length < 3) {
      setStepError('Describe the step in at least 3 characters.')
      return
    }
    addStep(template.id, trimmed)
    setNewStepLabel('')
    setStepError(undefined)
    notify('Step added to the template.', 'success')
  }

  const handleDuplicate = () => {
    const copy = duplicateTemplate(template.id)
    if (!copy) return
    notify('Template duplicated.', 'success')
    navigate(`/templates/${copy.id}`)
  }

  const handleDelete = () => {
    deleteTemplate(template.id)
    setConfirmDelete(false)
    notify('Custom template deleted.', 'info')
    navigate('/templates')
  }

  const openStart = () => {
    setChecklistTitle(template.name)
    setChecklistCase('')
    setChecklistError(undefined)
    setStartOpen(true)
  }

  const handleStartChecklist = () => {
    const trimmed = checklistTitle.trim()
    if (trimmed.length < 3) {
      setChecklistError('Give this checklist a title with at least 3 characters.')
      return
    }
    const created = createChecklist(template.id, {
      title: trimmed,
      caseLabel: checklistCase || null,
    })
    if (!created) return
    setStartOpen(false)
    notify('Checklist started from this template.', 'success')
    navigate(`/checklists/${created.id}`)
  }

  return (
    <div className="page">
      <div>
        <Link className="btn btn-ghost btn-sm" to="/templates">
          ← All templates
        </Link>
      </div>

      <PageHeader
        eyebrow="Template editor"
        eyebrowIcon="templates"
        title={template.name}
        description={template.description}
        actions={
          <>
            <Button variant="ghost" icon="copy" onClick={handleDuplicate}>
              Duplicate
            </Button>
            {!template.isSeeded ? (
              <Button variant="danger" icon="trash" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : null}
            <Button variant="primary" icon="plus" onClick={openStart} disabled={enabledSteps.length === 0}>
              Start checklist
            </Button>
          </>
        }
      />

      {template.isSeeded ? (
        <div className="callout callout-info">
          <span>
            This is a seeded demo template. Edits are saved to your browser only — duplicate it first
            if you want to keep the original wording intact.
          </span>
        </div>
      ) : null}

      <div className="grid-sidebar">
        <div className="stack stack-5">
          <Card>
            <CardHeader headingLevel={2} title="Template details" />
            <CardBody className="stack stack-4">
              <TextInput
                label="Template name"
                value={template.name}
                onChange={(event) => updateMeta(template.id, { name: event.target.value })}
              />
              <TextArea
                label="Description"
                value={template.description}
                onChange={(event) => updateMeta(template.id, { description: event.target.value })}
              />
              <SelectField
                label="Workflow type"
                options={WORKFLOW_KINDS.map((kind) => ({
                  value: kind,
                  label: WORKFLOW_LABELS[kind],
                }))}
                value={template.kind}
                onChange={(event) => updateMeta(template.id, { kind: event.target.value as WorkflowKind })}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              headingLevel={2}
              title="Steps"
              subtitle="Reorder with the arrows. Disabled steps stay in the template but are skipped when a checklist is created."
              actions={
                <Badge tone="neutral">
                  {enabledSteps.length} of {template.steps.length} enabled
                </Badge>
              }
            />
            <CardBody className="stack stack-4">
              {template.steps.length === 0 ? (
                <EmptyState
                  icon="checklist"
                  title="No steps yet"
                  body="Add the first administrative step this workflow should always include."
                />
              ) : (
                <ul className="template-steps">
                  {template.steps.map((step, index) => {
                    const isEditing = editingStepId === step.id
                    return (
                      <li key={step.id}>
                        <div
                          className={`template-step-row ${step.enabled ? '' : 'is-disabled'}`.trim()}
                        >
                          <input
                            type="checkbox"
                            checked={step.enabled}
                            aria-label={`Enable step: ${step.label}`}
                            style={{
                              width: 17,
                              height: 17,
                              marginTop: 3,
                              flex: 'none',
                              accentColor: 'var(--signal)',
                            }}
                            onChange={() =>
                              updateStep(template.id, step.id, { enabled: !step.enabled })
                            }
                          />
                          <span className="step-index" aria-hidden="true">
                            {index + 1}
                          </span>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            {isEditing ? (
                              <div className="stack stack-3">
                                <TextInput
                                  label="Step label"
                                  value={step.label}
                                  onChange={(event) =>
                                    updateStep(template.id, step.id, { label: event.target.value })
                                  }
                                />
                                <TextInput
                                  label="Helper text"
                                  value={step.hint}
                                  placeholder="Why this step matters, or how it is usually done"
                                  onChange={(event) =>
                                    updateStep(template.id, step.id, { hint: event.target.value })
                                  }
                                />
                                <SelectField
                                  label="Suggested owner"
                                  options={[
                                    { value: '', label: 'No suggested role' },
                                    ...TEAM_ROLES.map((role) => ({ value: role, label: role })),
                                  ]}
                                  value={step.suggestedRole ?? ''}
                                  onChange={(event) =>
                                    updateStep(template.id, step.id, {
                                      suggestedRole: (event.target.value || null) as TeamRole | null,
                                    })
                                  }
                                />
                                <div className="row">
                                  <div className="spacer" />
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    icon="check"
                                    onClick={() => setEditingStepId(null)}
                                  >
                                    Done
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="template-step-label">{step.label}</p>
                                {step.hint ? <p className="template-step-hint">{step.hint}</p> : null}
                                {step.suggestedRole ? (
                                  <p className="template-step-hint">
                                    Suggested owner: {step.suggestedRole}
                                  </p>
                                ) : null}
                              </>
                            )}
                          </div>

                          {!isEditing ? (
                            <div className="template-step-actions">
                              <IconButton
                                size="sm"
                                label={`Move up: ${step.label}`}
                                icon="arrowUp"
                                disabled={index === 0}
                                onClick={() => moveStep(template.id, step.id, -1)}
                              />
                              <IconButton
                                size="sm"
                                label={`Move down: ${step.label}`}
                                icon="arrowDown"
                                disabled={index === template.steps.length - 1}
                                onClick={() => moveStep(template.id, step.id, 1)}
                              />
                              <IconButton
                                size="sm"
                                label={`Edit step: ${step.label}`}
                                icon="edit"
                                onClick={() => setEditingStepId(step.id)}
                              />
                              <IconButton
                                size="sm"
                                label={`Remove step: ${step.label}`}
                                icon="trash"
                                onClick={() => {
                                  removeStep(template.id, step.id)
                                  notify('Step removed.', 'info')
                                }}
                              />
                            </div>
                          ) : null}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}

              <div className="row row-wrap" style={{ alignItems: 'flex-end' }}>
                <TextInput
                  label="Add a step"
                  className="spacer"
                  value={newStepLabel}
                  error={stepError}
                  placeholder="e.g. Confirm the receiving department contact"
                  onChange={(event) => {
                    setNewStepLabel(event.target.value)
                    if (stepError) setStepError(undefined)
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleAddStep()
                    }
                  }}
                />
                <Button variant="secondary" icon="plus" onClick={handleAddStep}>
                  Add step
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Live output of the blueprint: rendered on a drafting grid so it
            reads as the produced procedure, not another editing panel. */}
        <Card className="sticky-panel">
          <CardHeader
            headingLevel={2}
            title="Workflow preview"
            subtitle="Exactly what a new checklist created from this template will contain."
            actions={<span className="eyebrow">Live</span>}
          />
          <CardBody className="blueprint-preview">
            {enabledSteps.length === 0 ? (
              <EmptyState
                icon="checklist"
                title="No enabled steps"
                body="Enable at least one step before starting a checklist from this template."
              />
            ) : (
              <ol className="preview-step-list">
                {enabledSteps.map((step, index) => (
                  <li className="preview-step" key={step.id}>
                    <span className="step-index" aria-hidden="true">
                      {index + 1}
                    </span>
                    <div>
                      <p className="template-step-label">{step.label}</p>
                      {step.hint ? <p className="template-step-hint">{step.hint}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardBody>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this template?"
        message={`"${template.name}" will be removed. Checklists already created from it are not affected.`}
        confirmLabel="Delete template"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <Modal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        title="Start a checklist"
        description={`${enabledSteps.length} enabled step${enabledSteps.length === 1 ? '' : 's'} will be copied into the new checklist.`}
        footer={
          <>
            <div className="spacer" />
            <Button variant="ghost" onClick={() => setStartOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon="check" onClick={handleStartChecklist}>
              Start checklist
            </Button>
          </>
        }
      >
        <div className="stack stack-4">
          <TextInput
            label="Checklist title"
            required
            value={checklistTitle}
            error={checklistError}
            onChange={(event) => {
              setChecklistTitle(event.target.value)
              if (checklistError) setChecklistError(undefined)
            }}
          />
          <SelectField
            label="Case reference"
            options={caseOptions}
            help="Non-identifying demo labels only."
            value={checklistCase}
            onChange={(event) => setChecklistCase(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
