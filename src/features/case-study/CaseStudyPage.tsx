import { Link } from 'react-router-dom'

import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { BrandMark } from '@/components/ui/BrandMark'
import { Avatar } from '@/components/ui/Avatar'

const FEATURES = [
  {
    title: 'Shift overview',
    body: 'One screen showing open work, completions, items awaiting handoff, documentation progress, and recent activity.',
    to: '/',
  },
  {
    title: 'Task board',
    body: 'Create, assign, categorize, filter, and search administrative tasks across five workflow states.',
    to: '/tasks',
  },
  {
    title: 'Structured handoff builder',
    body: 'A six-section guided template with draft, preview, copy, and a mark-handed-off record trail.',
    to: '/handoff',
  },
  {
    title: 'Documentation checklists',
    body: 'Running checklists with per-step ownership, notes, timestamps, and a progress indicator.',
    to: '/checklists',
  },
  {
    title: 'Workflow templates',
    body: 'Duplicate, edit, reorder, and enable or disable steps, then preview exactly what a checklist will contain.',
    to: '/templates',
  },
  {
    title: 'Team & workload',
    body: 'Operational counts by category and by person, plus checklist and handoff completion summaries.',
    to: '/team',
  },
  {
    title: 'Activity history',
    body: 'A timestamped log of every workflow change, grouped by day and filterable by entity.',
    to: '/activity',
  },
]

const JOURNEY = [
  {
    title: 'Start of shift — orient in under a minute',
    body: 'The charge nurse opens the shift overview and sees what carried over: five open tasks, two flagged for handoff, one blocked item, and documentation running at 62 percent.',
  },
  {
    title: 'During the shift — capture work where it happens',
    body: 'A coordination call that gets no answer becomes a task with a category, an owner, a due time, and a note about what was already tried — so nobody redials the same desk.',
  },
  {
    title: 'Mid-shift — run the repeatable workflow',
    body: 'A discharge starts. Instead of remembering seven administrative steps, the coordinator starts a checklist from the discharge template and assigns steps as they go.',
  },
  {
    title: 'Last hour — build the handoff from real state',
    body: 'The shift-change checklist prompts a status sweep. Open items get flagged “awaiting handoff”, then linked into a structured handoff record rather than retyped from memory.',
  },
  {
    title: 'Handoff — the same six sections every time',
    body: 'Situation, background, outstanding tasks, communication completed, follow-up needed, and open questions. Preview it, copy it, mark it handed off. The record is timestamped.',
  },
  {
    title: 'Afterwards — reconstruct what happened',
    body: 'When someone asks why an item stalled, the activity history shows who moved it, when, and what note came with it.',
  },
]

const DECISIONS = [
  {
    head: 'Priority is chosen, never computed.',
    body: 'Any system that auto-ranks work on a nursing unit will eventually be read as clinical guidance. Priority in ShiftSignal is an ordering label the user picks, and the interface says so in the form itself.',
  },
  {
    head: 'The unit of work is the coordination item, not the patient.',
    body: 'Tasks belong to a shift and optionally reference an opaque case label. That keeps the tool firmly on the administrative side of the line and makes it safe to demonstrate publicly.',
  },
  {
    head: 'Notes matter more than status.',
    body: '“Blocked” is not useful on its own. “Placement desk is between coverage until 16:00” is. Every task carries an append-only note history so context travels with the item.',
  },
  {
    head: 'Handoff should be structured, not free text.',
    body: 'The same six prompts every time, with the required ones enforced before a record can be marked ready. Structure is what makes a handoff comparable shift to shift.',
  },
  {
    head: 'Checklists are generated from templates, not retyped.',
    body: 'Units already have repeatable workflows. Making them editable templates means a charge nurse can adapt a process without waiting on a vendor.',
  },
  {
    head: 'Overdue is shown, not enforced.',
    body: 'A past-due badge informs. It does not escalate, alarm, or notify anyone, because nothing here has the clinical context to justify an alert.',
  },
]

const BOUNDARIES = [
  'No diagnosis, treatment, medication, or triage guidance of any kind.',
  'No clinical prioritization — task priority is a coordination label the user picks, never derived from patient data.',
  'No acuity scores, risk stratification, or outcome prediction.',
  'No patient identifiers. Cases are opaque labels such as “Demo Case A”.',
  'Not an EHR, not a medical device, and no claim of HIPAA compliance.',
  'Explicitly framed in-product as organization support, not documentation of record.',
]

const LIMITATIONS = [
  'Single-user demo. There is no authentication, no server, and no multi-device sync.',
  'All state lives in one browser via localStorage; clearing site data resets everything.',
  'No audit trail suitable for compliance, no role-based permissions, no data retention controls.',
  'Team members, shifts, and cases are invented for the demo and do not model a real unit.',
  'Analytics are simple counts. There is no trend analysis, forecasting, or benchmarking.',
  'Real deployment would require institutional review, security assessment, integration work, and validation against actual unit policy — none of which this concept attempts.',
]

const SPEC = [
  { key: 'Role', value: 'Concept, workflow analysis, design, build' },
  { key: 'Domain', value: 'Nursing unit coordination' },
  { key: 'Surface', value: '8 routes · 4 linked objects' },
  { key: 'Status', value: 'Fictional concept demo' },
]

export function CaseStudyPage() {
  return (
    <div className="page case-study">
      {/* Dossier header: what this is, at a glance, before any narrative. */}
      <header className="case-hero">
        <span className="concept-tag">
          <Icon name="book" size={12} />
          Concept Demo
        </span>
        <div className="row" style={{ marginTop: 'var(--space-5)', alignItems: 'flex-start' }}>
          <span style={{ color: 'var(--signal)', flex: 'none' }}>
            <BrandMark size={38} />
          </span>
          <h1>ShiftSignal: making shift coordination visible</h1>
        </div>
        <p>
          A fictional product concept exploring how a nursing unit could organize administrative
          tasks, documentation workflows, and shift handoffs in one place — designed from the bedside
          perspective of what actually goes missing between shifts.
        </p>

        <div className="case-spec">
          {SPEC.map((item) => (
            <div className="case-spec-cell" key={item.key}>
              <span className="case-spec-key">{item.key}</span>
              <span className="case-spec-val">{item.value}</span>
            </div>
          ))}
        </div>
      </header>

      <div className="callout callout-safety">
        <Icon name="shield" size={16} />
        <span>
          <strong>This is a portfolio demonstration, not a product.</strong> ShiftSignal is not a
          real hospital system, electronic health record, clinical decision-support tool, or
          HIPAA-compliant platform. It contains no protected health information, offers no medical
          guidance, and is not affiliated with any health system or vendor.
        </span>
      </div>

      <section className="case-section stack stack-4" id="problem" aria-labelledby="problem-title">
        <h2 id="problem-title" data-index="01">
          The workflow problem
        </h2>
        {/* Set on the same paper stock as the handoff brief: this is the part
            of the page that is read, not scanned. */}
        <div className="case-doc stack stack-4">
          <p className="eyebrow">Field notes</p>
          <p>
            A large share of a nurse&apos;s shift is not clinical care — it is coordination. Calling a
            placement desk. Chasing a transport confirmation. Confirming a packet was assembled.
            Getting a signature on an equipment log. Remembering that someone already tried a number
            twice and got no answer.
          </p>
          <p>
            That work is real, time-consuming, and almost entirely undocumented. It lives on paper
            scraps, in whiteboard shorthand, in a report sheet folded into a pocket, and in whatever
            the outgoing nurse happens to remember at 19:00. When it does not transfer cleanly, the
            cost is duplicated calls, stalled items nobody owns, and a handoff that varies with how
            tired the person giving it is.
          </p>
          <p>
            The electronic health record is not designed for this. It records clinical care
            exceptionally well and coordination work barely at all. So units fill the gap with
            personal systems that do not survive a shift change.
          </p>
        </div>
      </section>

      <section
        className="case-section stack stack-4"
        id="perspective"
        aria-labelledby="perspective-title"
      >
        <h2 id="perspective-title" data-index="02">
          RN-informed design decisions
        </h2>
        <p>
          Several design decisions here come directly from bedside experience rather than from
          general product intuition:
        </p>
        <ul className="decision-list">
          {DECISIONS.map((item, index) => (
            <li className="decision-item" key={item.head}>
              <span className="decision-num" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>
                <strong>{item.head}</strong>
                {item.body}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="case-section stack stack-4" id="solution" aria-labelledby="solution-title">
        <h2 id="solution-title" data-index="03">
          Proposed solution
        </h2>
        <p>
          One shared surface for the coordination layer of a shift, built around four connected
          objects: <strong>tasks</strong> (discrete administrative work), <strong>checklists</strong>{' '}
          (repeatable workflows instantiated from templates), <strong>handoff records</strong>{' '}
          (structured shift-to-shift summaries), and an <strong>activity log</strong> that ties them
          together with timestamps.
        </p>
        <p>
          Because the objects are connected, the handoff can be assembled from real state rather than
          recalled. Tasks flagged “awaiting handoff” are the ones offered for linking into the
          packet; checklist progress rolls up to the shift overview; every change lands in the
          activity history automatically.
        </p>
      </section>

      <section className="case-section stack stack-4" id="journey" aria-labelledby="journey-title">
        <h2 id="journey-title" data-index="04">
          One shift, end to end
        </h2>
        <ol className="journey-list">
          {JOURNEY.map((step, index) => (
            <li className="journey-step" key={step.title}>
              <span className="journey-num" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="case-section stack stack-4" id="screens" aria-labelledby="screens-title">
        <h2 id="screens-title" data-index="05">
          Screens and features
        </h2>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <h3>
                <Link to={feature.to}>{feature.title}</Link>
              </h3>
              <p>{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="case-section stack stack-4" id="safety" aria-labelledby="safety-title">
        <h2 id="safety-title" data-index="06">
          Safety boundaries
        </h2>
        <p>
          The hardest constraint in a healthcare-adjacent concept is staying clearly on the
          administrative side of the line. These boundaries are enforced in the data model, not just
          in copy — there are no fields for clinical data anywhere in the schema.
        </p>
        <Card>
          <CardBody>
            <ul className="case-list">
              {BOUNDARIES.map((item) => (
                <li key={item}>
                  <Icon name="shield" size={17} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <section
        className="case-section stack stack-4"
        id="technology"
        aria-labelledby="technology-title"
      >
        <h2 id="technology-title" data-index="07">
          Technology
        </h2>
        <p>
          Built to run entirely offline with no backend and no paid services, so the demonstration
          works from a static host or a local checkout.
        </p>
        <ul className="tech-list">
          {[
            'React 19',
            'TypeScript (strict)',
            'Vite 7',
            'React Router 7',
            'Zustand + localStorage persistence',
            'Vitest + Testing Library',
            'Hand-authored CSS design tokens',
            'No runtime dependencies beyond the above',
          ].map((tech) => (
            <li className="tech-pill" key={tech}>
              {tech}
            </li>
          ))}
        </ul>
        <p>
          State is a single normalized store persisted to one localStorage key with a schema version.
          Every mutation writes a structured activity event, which is what makes the history view
          possible without extra bookkeeping. The seeded dataset is generated relative to the current
          time, so the demo always looks like a live shift.
        </p>
      </section>

      <section
        className="case-section stack stack-4"
        id="limitations"
        aria-labelledby="limitations-title"
      >
        <h2 id="limitations-title" data-index="08">
          Limitations
        </h2>
        <Card>
          <CardBody>
            <ul className="case-list">
              {LIMITATIONS.map((item) => (
                <li key={item}>
                  <Icon name="info" size={17} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </section>

      <Card>
        <CardHeader headingLevel={2} title="About this concept" />
        <CardBody>
          <div className="attribution">
            <Avatar
              member={{
                id: 'attribution',
                name: 'Samuel Garcia',
                initials: 'SG',
                role: 'Charge Nurse',
                focus: 'Concept author',
                accent: 0,
              }}
              size="lg"
              showTitle={false}
            />
            <div>
              <p style={{ fontWeight: 660, color: 'var(--ink)' }}>Samuel Garcia, RN</p>
              <p className="text-sm text-secondary">
                Concept, workflow analysis, product design, and implementation.
              </p>
              <p className="text-sm text-muted" style={{ marginTop: 'var(--space-2)' }}>
                Psalm Wave LLC · ShiftSignal is an independent portfolio concept and is not
                affiliated with, endorsed by, or derived from any employer, health system, or vendor
                product.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
