import { useMemo, useState } from 'react'

import type { ActivityEntity, ActivityEvent, ActivityKind } from '@/types/domain'
import { useDemoStore } from '@/store/useDemoStore'
import { findMember } from '@/store/selectors'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchInput, SelectField } from '@/components/ui/Form'
import { Icon, type IconName } from '@/components/ui/Icon'
import type { Tone } from '@/lib/labels'
import { dayBucket, formatDateTime, formatRelative, formatTime } from '@/lib/time'

const ENTITY_LABELS: Record<ActivityEntity, string> = {
  task: 'Tasks',
  handoff: 'Handoffs',
  checklist: 'Checklists',
  template: 'Templates',
  demo: 'Demo data',
}

const KIND_ICONS: Record<ActivityKind, IconName> = {
  created: 'plus',
  updated: 'edit',
  'status-changed': 'arrowRight',
  assigned: 'user',
  completed: 'check',
  reopened: 'refresh',
  'note-added': 'file',
  'step-completed': 'check',
  'step-reopened': 'refresh',
  'handed-off': 'handoff',
  duplicated: 'copy',
  deleted: 'trash',
  reset: 'refresh',
}

const KIND_TONES: Partial<Record<ActivityKind, Tone>> = {
  completed: 'success',
  'step-completed': 'success',
  'handed-off': 'accent',
  'status-changed': 'progress',
  created: 'progress',
  deleted: 'warn',
  reset: 'warn',
}

function groupByDay(events: ActivityEvent[]): Array<[string, ActivityEvent[]]> {
  const groups = new Map<string, ActivityEvent[]>()
  for (const event of events) {
    const key = dayBucket(event.at)
    const bucket = groups.get(key)
    if (bucket) bucket.push(event)
    else groups.set(key, [event])
  }
  return Array.from(groups.entries())
}

export function ActivityPage() {
  const activity = useDemoStore((state) => state.activity)
  const members = useDemoStore((state) => state.members)

  const [entity, setEntity] = useState<ActivityEntity | 'all'>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return activity
      .filter((event) => (entity === 'all' ? true : event.entity === entity))
      .filter((event) => {
        if (!query) return true
        const actor = findMember(members, event.actorId)?.name ?? ''
        return `${event.summary} ${event.detail ?? ''} ${actor}`.toLowerCase().includes(query)
      })
      .slice()
      .sort((a, b) => b.at.localeCompare(a.at))
  }, [activity, entity, search, members])

  const groups = useMemo(() => groupByDay(filtered), [filtered])
  const hasFilters = entity !== 'all' || search.trim().length > 0

  return (
    <div className="page">
      <PageHeader
        eyebrow="Activity history"
        eyebrowIcon="activity"
        title="What changed, and when"
        description="A running log of every workflow change in this browser. Useful for reconstructing why a task moved or when a handoff was completed."
      />

      <Card>
        <div className="filter-bar">
          <SearchInput
            label="Search activity"
            value={search}
            onChange={setSearch}
            placeholder="Search activity summaries and people"
          />
          <SelectField
            label="Entity"
            options={[
              { value: 'all', label: 'All activity' },
              ...(Object.keys(ENTITY_LABELS) as ActivityEntity[]).map((key) => ({
                value: key,
                label: ENTITY_LABELS[key],
              })),
            ]}
            value={entity}
            onChange={(event) => setEntity(event.target.value as ActivityEntity | 'all')}
          />
          {hasFilters ? (
            <Button
              variant="ghost"
              icon="close"
              onClick={() => {
                setEntity('all')
                setSearch('')
              }}
              style={{ marginBottom: 1 }}
            >
              Clear
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="status-strip" role="status" aria-live="polite">
        <span>
          Showing <strong>{filtered.length}</strong> of {activity.length} events
        </span>
      </div>

      <Card>
        {/* The ledger runs edge to edge; the empty state keeps its padding. */}
        <CardBody flush={groups.length > 0}>
          {groups.length === 0 ? (
            <EmptyState
              icon="activity"
              title={activity.length === 0 ? 'No activity recorded' : 'No matching activity'}
              body={
                activity.length === 0
                  ? 'Create a task or update a checklist and it will show up here immediately.'
                  : 'Try a different search term or switch the entity filter.'
              }
              action={
                hasFilters ? (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEntity('all')
                      setSearch('')
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          ) : (
            groups.map(([day, events]) => (
              // Event ledger: clock column, marker on the rail, then what
              // happened, who did it, and to which workflow.
              <div className="activity-group" key={day}>
                <p className="activity-day">
                  <Icon name="calendar" size={12} aria-hidden="true" />
                  {day}
                  <span className="spacer" />
                  <span>{events.length} events</span>
                </p>
                <ul className="activity-list">
                  {events.map((event) => {
                    const actor = findMember(members, event.actorId)
                    const tone = KIND_TONES[event.kind]
                    return (
                      <li className="activity-item" key={event.id}>
                        <span className="activity-time">{formatTime(event.at)}</span>
                        <span className={`activity-marker ${tone ? `tone-${tone}` : ''}`.trim()}>
                          <Icon name={KIND_ICONS[event.kind]} size={12} />
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <p className="activity-summary">{event.summary}</p>
                          {event.detail ? <p className="activity-detail">{event.detail}</p> : null}
                          <p className="activity-meta">
                            <span className="eyebrow">{ENTITY_LABELS[event.entity]}</span>
                            {actor ? <span>{actor.name}</span> : null}
                            <span>{formatRelative(event.at)}</span>
                            <span>{formatDateTime(event.at)}</span>
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  )
}
