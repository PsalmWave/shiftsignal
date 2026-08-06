import { useMemo, useState } from 'react'

import type { HandoffRecord, HandoffSectionKey, HandoffSections } from '@/types/domain'
import { useDemoStore } from '@/store/useDemoStore'
import { findMember } from '@/store/selectors'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button, IconButton } from '@/components/ui/Button'
import { Badge, CaseChip } from '@/components/ui/Badge'
import { SelectField, TextArea, TextInput } from '@/components/ui/Form'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Icon } from '@/components/ui/Icon'
import { BrandMark } from '@/components/ui/BrandMark'
import { useToast } from '@/components/ui/Toast'
import {
  HANDOFF_SECTIONS,
  HANDOFF_STATUS_LABELS,
  HANDOFF_STATUS_TONES,
  STATUS_LABELS,
  STATUS_TONES,
} from '@/lib/labels'
import { caseOptions } from '@/features/tasks/options'
import { copyText } from '@/lib/clipboard'
import { formatDateTime, formatRelative } from '@/lib/time'
import { handoffToText, HANDOFF_DISCLAIMER } from './format'

type Mode = 'draft' | 'preview'

export interface HandoffBuilderProps {
  handoff: HandoffRecord
  onDeleted: () => void
}

export function HandoffBuilder({ handoff, onDeleted }: HandoffBuilderProps) {
  const members = useDemoStore((state) => state.members)
  const shifts = useDemoStore((state) => state.shifts)
  const tasks = useDemoStore((state) => state.tasks)
  const activity = useDemoStore((state) => state.activity)
  const updateHandoffSections = useDemoStore((state) => state.updateHandoffSections)
  const updateHandoffMeta = useDemoStore((state) => state.updateHandoffMeta)
  const toggleHandoffTask = useDemoStore((state) => state.toggleHandoffTask)
  const setHandoffReady = useDemoStore((state) => state.setHandoffReady)
  const markHandedOff = useDemoStore((state) => state.markHandedOff)
  const deleteHandoff = useDemoStore((state) => state.deleteHandoff)
  const { notify } = useToast()

  const [mode, setMode] = useState<Mode>('draft')
  const [sections, setSections] = useState<HandoffSections>(handoff.sections)
  const [showValidation, setShowValidation] = useState(false)
  const [confirmHandoff, setConfirmHandoff] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const readOnly = handoff.status === 'handed-off'
  const dirty = HANDOFF_SECTIONS.some(
    (section) => sections[section.key] !== handoff.sections[section.key],
  )

  const from = findMember(members, handoff.fromMemberId)
  const to = findMember(members, handoff.toMemberId)
  const shift = shifts.find((s) => s.id === handoff.shiftId)
  const shiftLabel = shift ? `${shift.label} · ${shift.unit}` : 'Unassigned shift'

  const linkedTasks = useMemo(
    () => handoff.linkedTaskIds.map((id) => tasks.find((t) => t.id === id)).filter((t) => !!t),
    [handoff.linkedTaskIds, tasks],
  )

  const linkableTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.shiftId === handoff.shiftId && task.status !== 'complete')
        .sort((a, b) => a.title.localeCompare(b.title)),
    [tasks, handoff.shiftId],
  )

  const recordActivity = useMemo(
    () => activity.filter((event) => event.entity === 'handoff' && event.entityId === handoff.id),
    [activity, handoff.id],
  )

  const missingRequired = HANDOFF_SECTIONS.filter(
    (section) => section.required && !sections[section.key].trim(),
  )

  const setSection = (key: HandoffSectionKey, value: string) =>
    setSections((current) => ({ ...current, [key]: value }))

  const handleSave = () => {
    updateHandoffSections(handoff.id, sections)
    notify('Handoff draft saved.', 'success')
  }

  const handleCopy = async () => {
    const text = handoffToText({
      handoff: { ...handoff, sections },
      from,
      to,
      linkedTasks,
      shiftLabel,
    })
    const ok = await copyText(text)
    notify(
      ok ? 'Handoff copied to your clipboard.' : 'Copy failed — select the preview text instead.',
      ok ? 'success' : 'warn',
    )
  }

  const handleMarkReady = () => {
    if (missingRequired.length > 0) {
      setShowValidation(true)
      notify('Complete the required sections before marking this ready.', 'warn')
      return
    }
    if (dirty) updateHandoffSections(handoff.id, sections)
    setHandoffReady(handoff.id, true)
    notify('Handoff marked ready for the incoming shift.', 'success')
  }

  const handleMarkHandedOff = () => {
    if (dirty) updateHandoffSections(handoff.id, sections)
    markHandedOff(handoff.id)
    setConfirmHandoff(false)
    notify('Handoff recorded as handed off.', 'success')
  }

  const handleDelete = () => {
    deleteHandoff(handoff.id)
    setConfirmDelete(false)
    notify('Handoff record deleted.', 'info')
    onDeleted()
  }

  return (
    <div className="stack stack-5">
      <Card>
        <CardHeader
          headingLevel={2}
          title={handoff.title}
          subtitle={
            <>
              {shiftLabel} · Updated {formatRelative(handoff.updatedAt)}
            </>
          }
          actions={
            <>
              <Badge tone={HANDOFF_STATUS_TONES[handoff.status]} dot>
                {HANDOFF_STATUS_LABELS[handoff.status]}
              </Badge>
              <IconButton
                label="Delete handoff record"
                icon="trash"
                onClick={() => setConfirmDelete(true)}
              />
            </>
          }
        />

        <CardBody className="stack stack-5">
          <div className="callout callout-safety">
            <Icon name="shield" size={16} />
            <span>
              <strong>Not a clinical handoff of record.</strong> This structured summary organizes
              administrative follow-up only. It does not replace clinical judgment, verbal handoff,
              or your institution&apos;s approved documentation.
            </span>
          </div>

          <div className="segmented" role="group" aria-label="Handoff view">
            <button type="button" aria-pressed={mode === 'draft'} onClick={() => setMode('draft')}>
              Draft
            </button>
            <button
              type="button"
              aria-pressed={mode === 'preview'}
              onClick={() => setMode('preview')}
            >
              Preview
            </button>
          </div>

          {mode === 'draft' ? (
            <>
              <div className="form-grid">
                <TextInput
                  label="Handoff title"
                  className="span-2"
                  value={handoff.title}
                  disabled={readOnly}
                  onChange={(event) => updateHandoffMeta(handoff.id, { title: event.target.value })}
                />
                <SelectField
                  label="Handing off to"
                  options={[
                    { value: '', label: 'Not yet assigned' },
                    ...members.map((member) => ({
                      value: member.id,
                      label: `${member.name} · ${member.role}`,
                    })),
                  ]}
                  value={handoff.toMemberId ?? ''}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateHandoffMeta(handoff.id, { toMemberId: event.target.value || null })
                  }
                />
                <SelectField
                  label="Case reference"
                  options={caseOptions}
                  help="Non-identifying demo labels only."
                  value={handoff.caseLabel ?? ''}
                  disabled={readOnly}
                  onChange={(event) =>
                    updateHandoffMeta(handoff.id, { caseLabel: event.target.value || null })
                  }
                />
              </div>

              {/* Composition workspace: a section rail tracks what is still
                  blank while the writing surface stays uninterrupted. */}
              <div className="compose-grid">
                <div className="compose-rail">
                  <p className="compose-rail-title">Sections</p>
                  <ol className="handoff-rail">
                    {HANDOFF_SECTIONS.map((section, index) => {
                      const filled = Boolean(sections[section.key].trim())
                      return (
                        <li
                          key={section.key}
                          className={[
                            'handoff-rail-item',
                            filled ? 'is-complete' : '',
                            section.required ? 'is-required' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          <span className="handoff-rail-node" aria-hidden="true">
                            {filled ? <Icon name="check" size={10} /> : index + 1}
                          </span>
                          <span className="handoff-rail-label">
                            {section.label}
                            <span className="handoff-rail-state">
                              {filled ? 'Drafted' : section.required ? 'Required' : 'Optional'}
                            </span>
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                </div>

                <div>
                  {HANDOFF_SECTIONS.map((section, index) => {
                    const value = sections[section.key]
                    const invalid = showValidation && section.required && !value.trim()
                    return (
                      <div className="handoff-section" key={section.key}>
                        <div className="handoff-section-head">
                          {/* The number stays outside the heading so the section's
                              accessible name remains exactly its label. */}
                          <span className="step-index" aria-hidden="true">
                            {index + 1}
                          </span>
                          <h3 className="handoff-section-title">
                            {section.label}
                            {section.required ? (
                              <span className="field-required" aria-hidden="true">
                                *
                              </span>
                            ) : null}
                          </h3>
                          <span className="eyebrow">
                            {section.required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                        <TextArea
                          label={section.label}
                          hideLabel
                          value={value}
                          disabled={readOnly}
                          placeholder={section.placeholder}
                          help={section.helper}
                          error={invalid ? 'This section is required before handoff.' : undefined}
                          onChange={(event) => setSection(section.key, event.target.value)}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <section className="stack stack-3" aria-labelledby="linked-tasks-heading">
                <h3 className="card-title" id="linked-tasks-heading">
                  Linked workflow tasks
                </h3>
                <p className="field-help">
                  Attach open tasks so the incoming shift sees exactly what is outstanding.
                </p>
                {linkableTasks.length === 0 ? (
                  <EmptyState
                    icon="board"
                    title="No open tasks on this shift"
                    body="Once tasks are open on this shift they can be attached to the handoff packet."
                  />
                ) : (
                  <div>
                    {linkableTasks.map((task) => {
                      const checked = handoff.linkedTaskIds.includes(task.id)
                      return (
                        <label className="linked-task-row" key={task.id}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={readOnly}
                            style={{
                              width: 17,
                              height: 17,
                              marginTop: 2,
                              flex: 'none',
                              accentColor: 'var(--signal)',
                            }}
                            onChange={() => toggleHandoffTask(handoff.id, task.id)}
                          />
                          <span style={{ minWidth: 0 }}>
                            <span className="checklist-step-label">{task.title}</span>
                            <span className="row row-wrap" style={{ marginTop: 4 }}>
                              <Badge tone={STATUS_TONES[task.status]}>
                                {STATUS_LABELS[task.status]}
                              </Badge>
                              {task.caseLabel ? <CaseChip label={task.caseLabel} /> : null}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          ) : (
            <HandoffPreview
              title={handoff.title}
              sections={sections}
              fromName={from?.name ?? 'Unassigned'}
              toName={to?.name ?? 'Not yet assigned'}
              shiftLabel={shiftLabel}
              caseLabel={handoff.caseLabel}
              linkedTaskTitles={linkedTasks.map((task) => `${task.title} (${STATUS_LABELS[task.status]})`)}
            />
          )}
        </CardBody>

        <div className="compose-actions">
          {readOnly ? (
            <span className="row text-sm text-secondary">
              <Icon name="checkCircle" size={14} style={{ color: 'var(--signal)' }} /> Handed off{' '}
              {formatDateTime(handoff.handedOffAt)}
            </span>
          ) : (
            <>
              <Button variant="secondary" icon="check" onClick={handleSave} disabled={!dirty}>
                {dirty ? 'Save draft' : 'Saved'}
              </Button>
              <Button variant="ghost" icon="copy" onClick={handleCopy}>
                Copy
              </Button>
              <div className="spacer" />
              {handoff.status === 'draft' ? (
                <Button variant="secondary" icon="checkCircle" onClick={handleMarkReady}>
                  Mark ready
                </Button>
              ) : (
                <Button variant="ghost" icon="edit" onClick={() => setHandoffReady(handoff.id, false)}>
                  Back to draft
                </Button>
              )}
              <Button variant="primary" icon="handoff" onClick={() => setConfirmHandoff(true)}>
                Mark handed off
              </Button>
            </>
          )}
        </div>
      </Card>

      {readOnly ? (
        <Card>
          <CardBody>
            <Button variant="ghost" icon="copy" onClick={handleCopy}>
              Copy handoff text
            </Button>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Record activity"
          subtitle="Every change to this handoff, newest first."
        />
        <CardBody>
          {recordActivity.length === 0 ? (
            <EmptyState
              icon="activity"
              title="No activity yet"
              body="Saving, marking ready, or handing off this record will appear here."
            />
          ) : (
            <ul className="pulse-list">
              {recordActivity.map((event) => (
                <li className="pulse-item" key={event.id}>
                  <span className="activity-marker">
                    <Icon name="spark" size={11} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <span className="activity-summary" style={{ display: 'block' }}>
                      {event.summary}
                    </span>
                    <span className="pulse-time" style={{ display: 'block' }}>
                      {formatRelative(event.at)} · {formatDateTime(event.at)}
                      {event.detail ? ` · ${event.detail}` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmHandoff}
        title="Mark this handoff as handed off?"
        message="The record becomes read-only and is stamped with the current time. Use this after the verbal handoff conversation has happened."
        confirmLabel="Confirm handoff"
        onConfirm={handleMarkHandedOff}
        onCancel={() => setConfirmHandoff(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this handoff record?"
        message={`"${handoff.title}" and its draft content will be removed from this browser.`}
        confirmLabel="Delete record"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ */

interface HandoffPreviewProps {
  title: string
  sections: HandoffSections
  fromName: string
  toName: string
  shiftLabel: string
  caseLabel: string | null
  linkedTaskTitles: string[]
}

export function HandoffPreview({
  title,
  sections,
  fromName,
  toName,
  shiftLabel,
  caseLabel,
  linkedTaskTitles,
}: HandoffPreviewProps) {
  return (
    // Printed-brief surface: warm paper stock, a masthead, and numbered
    // sections — the one place in the console that is not dark.
    <div className="preview-doc">
      <div className="preview-masthead">
        <span className="preview-masthead-mark">
          <BrandMark size={26} />
        </span>
        <span style={{ minWidth: 0 }}>
          <span className="preview-doc-title" style={{ display: 'block' }}>
            {title}
          </span>
          <span className="preview-doc-meta" style={{ display: 'block' }}>
            {shiftLabel} · From {fromName} · To {toName}
            {caseLabel ? ` · ${caseLabel}` : ''}
          </span>
        </span>
      </div>

      <div>
        {HANDOFF_SECTIONS.map((section) => {
          const value = sections[section.key].trim()
          return (
            <div className="preview-block" key={section.key}>
              <p className="preview-heading">{section.label}</p>
              <p className={`preview-body ${value ? '' : 'is-empty'}`.trim()}>
                {value || 'Not documented'}
              </p>
            </div>
          )
        })}

        {linkedTaskTitles.length > 0 ? (
          <div className="preview-block">
            <p className="preview-heading">Linked workflow tasks</p>
            <ul className="preview-step-list">
              {linkedTaskTitles.map((label, index) => (
                <li className="preview-step" key={label}>
                  <span className="step-index" aria-hidden="true">
                    {index + 1}
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <p className="preview-doc-footer">{HANDOFF_DISCLAIMER}</p>
    </div>
  )
}
