import { Link, useNavigate } from 'react-router-dom'

import { useDemoStore } from '@/store/useDemoStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { WORKFLOW_LABELS } from '@/lib/labels'
import { formatRelative } from '@/lib/time'

export function TemplatesPage() {
  const templates = useDemoStore((state) => state.templates)
  const duplicateTemplate = useDemoStore((state) => state.duplicateTemplate)
  const navigate = useNavigate()
  const { notify } = useToast()

  const handleDuplicate = (id: string) => {
    const copy = duplicateTemplate(id)
    if (!copy) return
    notify('Template duplicated. Edit the copy freely.', 'success')
    navigate(`/templates/${copy.id}`)
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Workflow templates"
        eyebrowIcon="templates"
        title="Reusable workflow templates"
        description="The repeatable administrative sequences a unit runs every shift. Duplicate a template, adjust the steps for your unit, then start checklists from it."
      />

      {templates.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon="templates"
              title="No templates available"
              body="Reset the demo data to restore the seeded workflow templates."
            />
          </CardBody>
        </Card>
      ) : (
        // Blueprint shelf: each template shown as a drafted procedure rather
        // than a marketing card.
        <div className="template-grid">
          {templates.map((template) => {
            const enabled = template.steps.filter((step) => step.enabled).length
            return (
              <article className="template-row" key={template.id}>
                <div className="row row-wrap" style={{ alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <h2 className="template-row-title">
                      <Link to={`/templates/${template.id}`}>{template.name}</Link>
                    </h2>
                    <p className="template-row-kind">
                      {WORKFLOW_LABELS[template.kind]} · {enabled}/{template.steps.length} steps
                      enabled
                    </p>
                  </div>
                  <div className="spacer" />
                  <Badge tone={template.isSeeded ? 'info' : 'accent'}>
                    {template.isSeeded ? 'Seeded template' : 'Custom copy'}
                  </Badge>
                </div>

                <p className="text-sm text-secondary">{template.description}</p>

                <ul className="template-sample">
                  {template.steps.slice(0, 3).map((step, index) => (
                    <li key={step.id}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <span className="truncate">{step.label}</span>
                    </li>
                  ))}
                  {template.steps.length > 3 ? (
                    <li>
                      <span>+</span>
                      <span>{template.steps.length - 3} more steps</span>
                    </li>
                  ) : null}
                </ul>

                <div className="row row-wrap">
                  <span className="eyebrow">Updated {formatRelative(template.updatedAt)}</span>
                  <div className="spacer" />
                  {/* The visible labels repeat once per entry, so each control also
                      carries the template name for anyone navigating by button or
                      link list rather than by blueprint. */}
                  <Button
                    variant="ghost"
                    size="sm"
                    icon="copy"
                    onClick={() => handleDuplicate(template.id)}
                    aria-label={`Duplicate ${template.name}`}
                  >
                    Duplicate
                  </Button>
                  <Link
                    className="btn btn-secondary btn-sm"
                    to={`/templates/${template.id}`}
                    aria-label={`Open editor for ${template.name}`}
                  >
                    Open editor
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
