import { useMemo, useState } from 'react'

import { useDemoStore } from '@/store/useDemoStore'
import { findMember, summarizeHandoffs } from '@/store/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, CaseChip } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { SelectField, TextInput } from '@/components/ui/Form'
import { StatTile } from '@/components/ui/StatTile'
import { useToast } from '@/components/ui/Toast'
import { HANDOFF_STATUS_LABELS, HANDOFF_STATUS_TONES } from '@/lib/labels'
import { caseOptions } from '@/features/tasks/options'
import { formatRelative } from '@/lib/time'
import { HandoffBuilder } from './HandoffBuilder'

export function HandoffPage() {
  const handoffs = useDemoStore((state) => state.handoffs)
  const members = useDemoStore((state) => state.members)
  const currentUserId = useDemoStore((state) => state.currentUserId)
  const createHandoff = useDemoStore((state) => state.createHandoff)
  const { notify } = useToast()

  const sorted = useMemo(
    () => [...handoffs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [handoffs],
  )

  const [selectedId, setSelectedId] = useState<string | null>(sorted[0]?.id ?? null)
  const [createOpen, setCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newTo, setNewTo] = useState('')
  const [newCase, setNewCase] = useState('')
  const [titleError, setTitleError] = useState<string | undefined>()

  const selected = selectedId ? (handoffs.find((h) => h.id === selectedId) ?? null) : null
  const effective = selected ?? sorted[0] ?? null
  const summary = summarizeHandoffs(handoffs)

  const handleCreate = () => {
    const title = newTitle.trim()
    if (title.length < 3) {
      setTitleError('Give the handoff a short title with at least 3 characters.')
      return
    }
    const record = createHandoff({
      title,
      fromMemberId: currentUserId,
      toMemberId: newTo || null,
      caseLabel: newCase || null,
    })
    setSelectedId(record.id)
    setCreateOpen(false)
    setNewTitle('')
    setNewTo('')
    setNewCase('')
    setTitleError(undefined)
    notify('Handoff draft created.', 'success')
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Structured handoff"
        eyebrowIcon="handoff"
        title="Handoff builder"
        description="A guided template so outgoing shifts capture the same administrative information every time — what is outstanding, who has already been contacted, and what still needs follow-up."
        actions={
          <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>
            New handoff
          </Button>
        }
      />

      <div className="stat-grid">
        <StatTile label="Handoff records" value={summary.total} icon="handoff" />
        <StatTile label="Drafts in progress" value={summary.draft} icon="edit" />
        <StatTile label="Ready to hand off" value={summary.ready} icon="checkCircle" />
        <StatTile
          label="Handed off"
          value={`${summary.percent}%`}
          hint={`${summary.handedOff} of ${summary.total} records`}
          icon="check"
        />
      </div>

      <div className="grid-sidebar grid-sidebar-lead">
        <Card>
          <CardHeader title="Records" subtitle={`${handoffs.length} in this browser`} />
          <CardBody>
            {sorted.length === 0 ? (
              <EmptyState
                icon="handoff"
                title="No handoff records"
                body="Create a handoff draft to start capturing outstanding administrative work for the next shift."
                action={
                  <Button variant="primary" icon="plus" onClick={() => setCreateOpen(true)}>
                    New handoff
                  </Button>
                }
              />
            ) : (
              <ul className="handoff-list">
                {sorted.map((record) => {
                  const from = findMember(members, record.fromMemberId)
                  return (
                    <li key={record.id}>
                      <button
                        type="button"
                        className={`handoff-item ${effective?.id === record.id ? 'is-selected' : ''}`.trim()}
                        onClick={() => setSelectedId(record.id)}
                        aria-current={effective?.id === record.id ? 'true' : undefined}
                      >
                        <span className="row row-wrap">
                          <Badge tone={HANDOFF_STATUS_TONES[record.status]} dot>
                            {HANDOFF_STATUS_LABELS[record.status]}
                          </Badge>
                          {record.caseLabel ? <CaseChip label={record.caseLabel} /> : null}
                        </span>
                        <span className="handoff-item-title">{record.title}</span>
                        <span className="row text-xs text-muted">
                          <Avatar member={from} size="sm" showTitle={false} />
                          {from?.name ?? 'Unassigned'} · updated {formatRelative(record.updatedAt)}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        {effective ? (
          <HandoffBuilder
            key={effective.id}
            handoff={effective}
            onDeleted={() => setSelectedId(null)}
          />
        ) : (
          <Card>
            <CardBody>
              <EmptyState
                icon="handoff"
                title="Select or create a handoff"
                body="Choose a record from the list to open the guided builder, preview, and activity history."
              />
            </CardBody>
          </Card>
        )}
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New handoff draft"
        description="Handoff records organize administrative follow-up. They do not replace verbal handoff or clinical documentation."
        footer={
          <>
            <div className="spacer" />
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon="check" onClick={handleCreate}>
              Create draft
            </Button>
          </>
        }
      >
        <div className="stack stack-4">
          <TextInput
            label="Handoff title"
            required
            value={newTitle}
            error={titleError}
            placeholder="e.g. Day shift charge handoff"
            onChange={(event) => {
              setNewTitle(event.target.value)
              if (titleError) setTitleError(undefined)
            }}
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
            value={newTo}
            onChange={(event) => setNewTo(event.target.value)}
          />
          <SelectField
            label="Case reference"
            options={caseOptions}
            help="Non-identifying demo labels only."
            value={newCase}
            onChange={(event) => setNewCase(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
