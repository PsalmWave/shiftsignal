import { beforeEach, describe, expect, it } from 'vitest'
import { act, screen, within } from '@testing-library/react'

import { App } from './App'
import { renderWithProviders, resetStore } from '@/test/utils'
import { useDemoStore } from '@/store/useDemoStore'

beforeEach(() => {
  resetStore()
})

describe('App shell', () => {
  it('renders the shift overview with the demo disclaimer', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('heading', { name: 'Where the shift stands' })).toBeInTheDocument()
    expect(screen.getByText(/Not a medical device, EHR, or HIPAA-compliant system/i)).toBeInTheDocument()
    expect(screen.getByText('Fictional data only')).toBeInTheDocument()
  })

  it('summarizes the active shift', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('heading', { level: 2, name: 'Day shift' })).toBeInTheDocument()

    const hero = screen.getByRole('region', { name: 'Day shift' })
    for (const label of [
      'Open tasks',
      'Completed',
      'Awaiting handoff',
      'Documentation complete',
      'Past due',
    ]) {
      expect(within(hero).getByText(label)).toBeInTheDocument()
    }
  })

  it('exposes a skip link to the main content', () => {
    renderWithProviders(<App />)
    const skip = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skip).toHaveAttribute('href', '#main-content')
  })

  it('navigates between the primary sections', async () => {
    const { user } = renderWithProviders(<App />)
    const nav = screen.getByRole('navigation', { name: 'Primary' })

    await user.click(within(nav).getByRole('link', { name: /Task board/ }))
    expect(await screen.findByRole('heading', { name: 'Workflow tasks' })).toBeInTheDocument()

    await user.click(within(nav).getByRole('link', { name: /Handoffs/ }))
    expect(await screen.findByRole('heading', { name: 'Handoff builder' })).toBeInTheDocument()

    await user.click(within(nav).getByRole('link', { name: /Documentation/ }))
    expect(await screen.findByRole('heading', { name: 'Workflow checklists' })).toBeInTheDocument()

    await user.click(within(nav).getByRole('link', { name: /Templates/ }))
    expect(
      await screen.findByRole('heading', { name: 'Reusable workflow templates' }),
    ).toBeInTheDocument()

    await user.click(within(nav).getByRole('link', { name: /Team & workload/ }))
    expect(await screen.findByRole('heading', { name: 'Operational summary' })).toBeInTheDocument()

    await user.click(within(nav).getByRole('link', { name: /Activity history/ }))
    expect(await screen.findByRole('heading', { name: 'What changed, and when' })).toBeInTheDocument()

    await user.click(within(nav).getByRole('link', { name: /Case study/ }))
    expect(
      await screen.findByRole('heading', { name: 'ShiftSignal: making shift coordination visible' }),
    ).toBeInTheDocument()
  })

  it('resets demo data back to the seeded dataset', async () => {
    const { user } = renderWithProviders(<App />)

    // Driven through the store rather than the UI: this test is about the reset
    // control, not about task creation. `act` keeps the resulting re-render of the
    // already-mounted shell inside React's test scope.
    act(() => {
      useDemoStore.getState().createTask({
        title: 'Scratch task that should disappear',
        description: '',
        category: 'administrative',
        priority: 'normal',
        status: 'open',
        assigneeId: null,
        caseLabel: null,
        dueAt: null,
      })
      useDemoStore.getState().deleteTask('t-01')
    })
    expect(useDemoStore.getState().tasks.find((t) => t.id === 't-01')).toBeUndefined()

    await user.click(screen.getByRole('button', { name: /Reset demo data/ }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Reset demo data' }))

    const state = useDemoStore.getState()
    expect(state.tasks.find((t) => t.id === 't-01')).toBeDefined()
    expect(state.tasks.some((t) => t.title === 'Scratch task that should disappear')).toBe(false)
    expect(await screen.findByText('Demo data reset to the seeded dataset.')).toBeInTheDocument()
  })

  it('can cancel the reset without changing anything', async () => {
    const { user } = renderWithProviders(<App />)
    act(() => {
      useDemoStore.getState().deleteTask('t-01')
    })

    await user.click(screen.getByRole('button', { name: /Reset demo data/ }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(useDemoStore.getState().tasks.find((t) => t.id === 't-01')).toBeUndefined()
  })

  it('renders a not-found page for unknown routes', () => {
    renderWithProviders(<App />, { route: '/nope' })
    expect(screen.getByText('Page not found')).toBeInTheDocument()
  })
})

describe('Case study page', () => {
  it('is labelled as a concept demo and carries the attribution', () => {
    renderWithProviders(<App />, { route: '/case-study' })

    expect(screen.getByText('Concept Demo')).toBeInTheDocument()
    expect(screen.getByText(/This is a portfolio demonstration, not a product/i)).toBeInTheDocument()
    expect(screen.getByText('Samuel Garcia, RN')).toBeInTheDocument()
    // Also appears in the app footer, so both occurrences are expected.
    expect(screen.getAllByText(/Psalm Wave LLC/).length).toBeGreaterThanOrEqual(2)
  })

  it('documents its safety boundaries and limitations', () => {
    renderWithProviders(<App />, { route: '/case-study' })

    expect(screen.getByRole('heading', { name: 'Safety boundaries' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Limitations' })).toBeInTheDocument()
    expect(
      screen.getByText(/No diagnosis, treatment, medication, or triage guidance/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/no claim of HIPAA compliance/i)).toBeInTheDocument()
  })
})

describe('Team workload page', () => {
  it('renders workload rows without any clinical scoring language', () => {
    renderWithProviders(<App />, { route: '/team' })

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getAllByText('Samuel Garcia').length).toBeGreaterThan(0)
    expect(screen.getByText(/no acuity scores, no patient outcome predictions/i)).toBeInTheDocument()
  })
})

describe('Activity page', () => {
  it('filters the activity log by search text', async () => {
    const { user } = renderWithProviders(<App />, { route: '/activity' })

    await user.type(screen.getByRole('searchbox'), 'telemetry')

    expect(
      screen.getByText('Moved "Return telemetry box to biomedical engineering" to Awaiting handoff'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Started the day shift charge handoff draft')).not.toBeInTheDocument()
  })
})
