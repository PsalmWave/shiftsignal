# ShiftSignal

**A healthcare workflow and documentation organization tool — fictional concept demonstration.**

ShiftSignal is a portfolio concept exploring how a nursing unit could organize the *coordination layer*
of a shift: administrative tasks, repeatable documentation workflows, and structured shift-to-shift
handoffs, all in one place with a timestamped activity trail.

It was designed and built by **Samuel Garcia, RN / Psalm Wave LLC**, drawing on bedside nursing
experience to translate an operational workflow problem into working software.

**Live demo → [shiftsignal-ten.vercel.app](https://shiftsignal-ten.vercel.app)**

The demo runs entirely in your browser. Everything you change is stored in `localStorage` on your own
device only — nothing is sent anywhere — and **Reset demo data** in the command bar restores the
original seeded dataset at any time.

---

## ⚠️ Demo and safety disclaimers

**This is a portfolio demonstration, not a product.** Please read before using or sharing it.

- ShiftSignal is **not** a real hospital system, **not** an electronic health record, **not** a medical
  device, and **not** a clinical decision-support tool.
- It makes **no claim of HIPAA compliance** and has no safeguards appropriate for protected health
  information.
- It contains **no real patient data**. Every team member, shift, task, checklist, and handoff in the
  demo is invented. Cases are referenced only by opaque labels such as *Demo Case A*.
- It provides **no diagnosis, treatment, medication guidance, triage, clinical prioritization, or
  emergency recommendations** of any kind.
- Task priority is an **ordering label the user chooses**. It is never derived from patient data and is
  never a clinical urgency or acuity score.
- Analytics are **simple operational counts**. There are no clinical risk scores, acuity models, or
  patient outcome predictions.
- The handoff builder organizes administrative follow-up only. It does **not** replace clinical
  judgment, verbal handoff, or an institution's approved documentation of record.
- ShiftSignal is an independent concept and is **not affiliated with, endorsed by, or derived from**
  any employer, health system, or vendor product.

These boundaries are enforced in the data model, not only in copy: `src/types/domain.ts` deliberately
has **no fields** for diagnoses, medications, vitals, acuity, clinical severity, or patient
identifiers.

---

## Features

**Shift overview** (`/`) — the current fictional shift, team roster, open and completed task counts,
items awaiting handoff, documentation completion, past-due count, checklist progress, handoff status,
and recent activity on one screen.

**Task board** (`/tasks`) — create, assign, categorize, and track administrative work across five
states (Open, In progress, Blocked, Awaiting handoff, Complete). Supports due times, a user-chosen
priority, an optional opaque case reference, an append-only note history, full-text search, and
filtering by status, category, priority, assignee, and shift. Categories: Administrative,
Communication, Coordination, Documentation, Follow-up, Equipment, Education.

**Structured handoff builder** (`/handoff`) — a six-section guided template (Situation, Background,
Outstanding administrative tasks, Communication completed, Follow-up needed, Questions for next shift)
with Draft and Preview modes, save, copy-to-clipboard, linked workflow tasks, required-section
validation before a record can be marked ready, a "mark handed off" transition, and per-record activity
history.

**Documentation checklists** (`/checklists`) — running checklists instantiated from templates, with
per-step completion state, assigned owner, optional note, completion timestamp, and a progress
indicator. Covers admission, transfer, discharge coordination, shift-change preparation, equipment
handoff, and follow-up communication workflows.

**Workflow templates** (`/templates`) — view, duplicate, rename, add, edit, remove, reorder, and
enable/disable steps, with a live preview of exactly what a checklist created from the template will
contain. Seeded templates are protected from deletion; duplicates are freely editable.

**Team & workload** (`/team`) — open tasks by category, work items by team member, per-person blocked
/ awaiting-handoff / past-due counts, checklist progress, and handoff completion rate.

**Activity history** (`/activity`) — a timestamped log of every workflow change, grouped by day and
filterable by entity type and search text.

**Case study** (`/case-study`) — the workflow problem, the RN-informed design perspective, the proposed
solution, the main user journey, screens and features, safety boundaries, technology, and limitations.

**Reset demo data** — available from the command bar on every screen; restores the original seeded
dataset.

---

## Architecture

A single-page React application with no backend, no authentication, and no network calls. Everything
runs locally in the browser.

```
src/
  app/          App routes, AppShell (operations rail, command bar, mobile bar + sheet,
                banner, reset dialog), navigation config
  components/
    layout/     PageHeader + SafetyNote
    ui/         Reusable primitives: Button, Badge, Avatar, BrandMark, Card, Form controls,
                Progress, EmptyState, StatTile, Drawer, Modal/ConfirmDialog, Toast, Icon
  data/         seed.ts — the entire fictional dataset
  features/     One folder per product area (shift, tasks, handoff, checklists, templates,
                team, activity, case-study)
  hooks/        useFocusTrap, useMediaQuery
  lib/          labels, time formatting, id generation, clipboard helper
  store/        useDemoStore (Zustand + persist), selectors
  styles/       tokens.css, base.css, components.css, layout.css, pages.css
  test/         Shared render helpers
  types/        domain.ts — the whole domain model
```

**Key decisions**

- **Zustand + `persist`** to a single `localStorage` key (`shiftsignal.demo.v1`) with a schema version
  and migration hook. State is one normalized store; `partialize` persists data only, never actions.
- **Every mutation writes an activity event.** That is what makes the history view and the per-record
  audit trails free rather than a separate bookkeeping concern. The log is capped at 300 events.
- **`HashRouter`**, so deep links work from static hosting or straight off the filesystem without any
  server rewrite rules.
- **Hand-authored CSS design tokens** — no CSS framework and no icon library. Icons are a local SVG
  path map, so the app ships with zero runtime dependencies beyond React, the router, and Zustand.
- **Seed data is generated relative to `new Date()`**, so the demo always looks like a live shift
  rather than a stale fixture.

---

## Design system

ShiftSignal is styled as an **operations console** — the kind of board a charge nurse would keep open
on a unit workstation for twelve hours — rather than a patient-facing healthcare website.

**Surfaces.** A deep graphite shell (`--void #0a0e13`) carries slate panels (`--panel #151d26`)
separated by hairline rules instead of drop shadows. Exactly two surfaces break the dark shell, and
both are documents rather than UI: the handoff **preview brief** and the case-study narrative, which
render on a warm off-white paper stock (`--doc #f5f2ec`) so the artifact the shift produces looks
physically different from the console that produced it.

**Status colour is semantic, never decorative.**

| Token | Role |
| --- | --- |
| `--signal` mint `#35dfad` | the primary operational accent; also "complete" |
| `--amber` `#f0b429` | pending attention, awaiting handoff |
| `--coral` `#f2705f` | blocked or past due |
| `--azure` `#4fa8f5` | in progress |
| `--cyan` `#3fc9d6` | informational |
| `--steel` `#90a6b8` | neutral |

**Typography is split by purpose.** Compact, tightly tracked sans headings carry names and prose;
a monospace face carries everything an operator reads as an instrument value — clock times, counts,
percentages, IDs, status codes, and the uppercase micro-labels that mark every field and column.
Numerals are `tabular-nums` throughout so columns of counts stay aligned as data changes.

**Layout is zoned, not carded.** A fixed 88px operations rail holds navigation with live counters; a
sticky command bar carries the active shift, an elapsed-shift meter, and four telemetry readouts.
Pages compose from timelines, step tracks, section rails, ledgers, and allocation boards. Radii are
deliberately tight (2–8px) and squared, and metric rows are drawn as one joined instrument ribbon
sharing hairlines rather than a row of separate rounded cards.

**Motion is restrained and operational** — status transitions, panel reveals, timeline progression,
and checklist completion feedback. A single element pulses (the live-shift dot). Everything is
suppressed under `prefers-reduced-motion`.

**Brand mark.** An inline SVG of two signals passing through a relay node — the outgoing shift
running in along the top track, the oncoming shift running out along the bottom. Deliberately not a
medical cross or any clinical symbol.

---

## Data model

Defined in `src/types/domain.ts`. Every entity describes administrative and operational workflow only.

| Entity | Purpose | Notable fields |
| --- | --- | --- |
| `TeamMember` | Fictional staff member | `name`, `initials`, `role`, `focus`, `accent` |
| `Shift` | A demo shift | `label`, `unit`, `startsAt`, `endsAt`, `status` |
| `Task` | One administrative work item | `title`, `category`, `priority`, `status`, `assigneeId`, `dueAt`, `caseLabel`, `notes[]` |
| `TaskNote` | Append-only context on a task | `body`, `authorId`, `at` |
| `WorkflowTemplate` | A reusable workflow | `name`, `kind`, `description`, `isSeeded`, `steps[]` |
| `TemplateStep` | One step in a template | `label`, `hint`, `suggestedRole`, `enabled` |
| `Checklist` | A template instantiated for real work | `title`, `kind`, `templateId`, `status`, `caseLabel`, `steps[]` |
| `ChecklistStep` | One step being worked | `label`, `hint`, `complete`, `assigneeId`, `note`, `completedAt` |
| `HandoffRecord` | A structured shift handoff | `title`, `status`, `fromMemberId`, `toMemberId`, `caseLabel`, `sections{}`, `taskIds[]`, `handedOffAt` |
| `ActivityEvent` | One logged change | `entity`, `action`, `summary`, `detail`, `actorId`, `at` |

Enumerations: `TASK_CATEGORIES`, `TASK_PRIORITIES` (`low`/`normal`/`high`), `TASK_STATUSES`
(`open`/`in-progress`/`blocked`/`awaiting-handoff`/`complete`), `HANDOFF_SECTION_KEYS`,
`WORKFLOW_KINDS`, `TEAM_ROLES`.

The seeded dataset contains 7 team members, 3 shifts, 22 tasks, 6 workflow templates, 5 checklists,
4 handoff records, and 26 activity events.

---

## Setup

Requires **Node.js 20.19+ or 22.12+** (Vite 7) and npm.

```bash
npm install
```

## Run commands

Start the dev server (http://localhost:5173):

```bash
npm run dev
```

Type-check the whole project:

```bash
npm run typecheck
```

Run the test suite once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Build for production into `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

---

## Testing

[Vitest](https://vitest.dev) + [Testing Library](https://testing-library.com) in a jsdom environment,
driving the UI through real user interactions rather than implementation details.

**8 test files, 84 tests**, covering:

- `src/lib/time.test.ts` — date/time formatting, relative time, overdue detection
- `src/store/selectors.test.ts` — filtering, sorting, summaries, workload and progress math
- `src/store/useDemoStore.test.ts` — every task, handoff, checklist, template, and reset action,
  including activity logging and seeded-template protection
- `src/features/tasks/TaskBoardPage.test.tsx` — create with validation, status change, notes, filters,
  empty state
- `src/features/handoff/HandoffPage.test.tsx` — draft creation, required-section validation,
  save-only-when-dirty, mark handed off, activity trail
- `src/features/checklists/ChecklistDetailPage.test.tsx` — create from template, toggle steps, assign
  owners, add notes
- `src/features/templates/TemplateEditorPage.test.tsx` — add/reorder/enable/disable steps, preview,
  start a checklist
- `src/app/App.test.tsx` — routing across all sections, disclaimers, reset and cancel, not-found route

Each suite reseeds the store and clears `localStorage` between tests, so runs are independent.

---

## Deployment

The build is fully static and self-contained. `vite.config.ts` sets `base: './'` and the app uses
`HashRouter`, so `dist/` can be served from any subpath — or opened directly from the filesystem —
without server-side routing configuration.

```bash
npm run build
```

Then publish `dist/` to GitHub Pages, Netlify, Vercel, S3, or any static host. No environment
variables, no API keys, no paid services, and no backend are required.

---

## Accessibility notes

- Skip link to `#main-content`; `<main>` is focusable (`tabIndex={-1}`) as a navigation target.
- Semantic landmarks throughout, with `aria-labelledby` on every region, dialog, and drawer.
- Drawers and modals render through `createPortal` with a custom focus trap: focus moves in on open,
  cycles with Tab, closes on Escape, and returns to the trigger on close. Body scroll is locked while
  open.
- The desktop operations rail and the mobile bottom bar are mounted conditionally, so exactly one
  element carries the "Primary" navigation landmark at any width — never a hidden duplicate competing
  for the same landmark.
- The rail and bottom bar show abbreviated labels ("Docs", "Blueprints") but set the full destination
  name as the accessible name, with the open count appended — *"Documentation, 4 open"* — so the
  destination reads identically to screen readers at every breakpoint.
- The mobile overflow sheet is a `role="dialog"` with `aria-modal` and the same focus trap as the
  drawers, and it lives inside the navigation landmark so every destination stays in one place.
- Repeated controls carry disambiguating accessible names — e.g. *"Move up: Schedule transport with the
  coordination desk"*, *"Assign step: …"*, *"Duplicate Transfer workflow"* — so button and link lists
  are usable without surrounding visual context.
- Icon-only buttons always have a `label`. Controls whose visible text is hidden at narrow widths carry
  an explicit `aria-label` so they keep a name on mobile.
- Progress indicators use `role="progressbar"` with `aria-valuetext` (e.g. *"57 percent complete"*).
- Toasts render in an `aria-live="polite"` status region; form errors are wired up with
  `aria-describedby` and `aria-invalid`.
- Avatars are `aria-hidden` when a visible name sits beside them, so names are not announced twice.
- Colour is never the sole status carrier — every badge pairs colour with text, and status is also
  encoded by position (which lane, which track step) and by mono status codes.
- **Every text/background pair in the token system meets WCAG AA (4.5:1)** on both the dark console
  surfaces and the warm paper stock — measured, not assumed. The faintest text step sits at 4.6:1 on
  panels and the deep mint used for headings on paper at 5.4:1. Focus rings are a 2px mint outline at
  11.9:1.
- Touch targets on the mobile bar are 73×61 px, comfortably above the 44 px minimum.
- Respects `prefers-reduced-motion`, which disables transitions and animations.
- Verified with no horizontal overflow at 375 px, 768 px, and desktop widths across all eleven routes,
  and with zero console errors or warnings.

---

## Screenshot recommendations

The five most effective portfolio screenshots, in order:

1. **Shift command board (`/`) at 1440 px** — the strongest single frame, and the one that establishes
   the product category. Capture the operations rail, the command bar with its elapsed-shift meter and
   telemetry readouts, and the shift hero with its 12-tick timeline and joined instrument ribbon all in
   one shot. Take it mid-shift (roughly 10:00–16:00 local) so the "now" marker sits visibly inside the
   timeline rather than pinned at either end.
2. **Handoff builder (`/handoff`) in Preview mode** — the centerpiece. Frame it so the dark composition
   workspace and the warm paper-stock brief are both visible, because the contrast between console and
   artifact is the single most distinctive thing in the product. The safety disclaimer at the foot of
   the brief should stay legible.
3. **Task board (`/tasks`) with the filter bar and status strip visible** — five status lanes with
   colour-keyed column rails, priority stripes down the left edge of each card, past-due markers, and
   the "priority is user-selected, not a clinical urgency score" disclaimer in frame.
4. **Checklist track (`/checklists/:id`)** — shows the connected step track with the completed nodes
   ticked, the highlighted **current step**, and the progress gauge. This is the clearest picture of
   ownership and sequence, and it reads as an operational procedure rather than a to-do list.
5. **Case study (`/case-study`)** — capture the hero with the brand mark, the concept-demo tag, and the
   spec strip, plus at least one numbered section chip and the paper-stock field-notes block. It frames
   the whole project as RN-informed and deliberate.

Optional sixth: the **mobile shift overview at 375 px with the operations sheet open**, showing the
bottom bar, live counters, and the overflow sheet — evidence of responsive and accessible behaviour.

Two more worth taking if there is room: the **template editor** (blueprint steps beside the live
drafting-grid preview) and the **activity ledger** (clock column, tone-keyed markers, event rail).

Take screenshots after a fresh **Reset demo data** so counts and timestamps look coherent, and keep the
concept-demo banner visible — the disclaimer is part of the story.

---

## Known limitations

- **Single-user demo.** No authentication, no server, no multi-device sync, no collaboration.
- **All state lives in one browser** under a single `localStorage` key. Clearing site data, switching
  browsers, or using a private window resets everything.
- **No compliance-grade audit trail**, role-based permissions, retention policy, or encryption.
- **Copy-to-clipboard** requires a secure context and a focused document; where the Clipboard API is
  unavailable the app falls back to `document.execCommand` and, failing that, tells the user to select
  the preview text manually.
- **The dataset is invented** and does not model the staffing, pace, or policies of a real unit.
- **Analytics are counts only** — no trends, forecasting, or benchmarking.
- **No internationalization**; dates, times, and copy are English/US-locale only.
- **Not production software.** A real deployment would require institutional review, a security
  assessment, EHR integration work, and validation against actual unit policy — none of which this
  concept attempts.

---

*ShiftSignal — a fictional workflow concept by Samuel Garcia, RN / Psalm Wave LLC.
No PHI · No clinical guidance · Local browser storage only.*
