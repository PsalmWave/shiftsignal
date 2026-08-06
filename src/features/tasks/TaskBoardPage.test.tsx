import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'

import { TaskBoardPage } from './TaskBoardPage'
import { renderWithProviders, resetStore } from '@/test/utils'
import { useDemoStore } from '@/store/useDemoStore'

beforeEach(() => {
  resetStore()
})

describe('TaskBoardPage', () => {
  it('renders every board column with a live count', () => {
    renderWithProviders(<TaskBoardPage />)

    expect(screen.getByRole('heading', { name: 'Workflow tasks' })).toBeInTheDocument()
    for (const label of ['Open', 'In progress', 'Blocked', 'Awaiting handoff', 'Complete']) {
      expect(screen.getByRole('region', { name: new RegExp(`^${label} \\(\\d+\\)$`) })).toBeInTheDocument()
    }
    expect(screen.getByText('Confirm transport scheduling for Demo Case A')).toBeInTheDocument()
  })

  it('states plainly that priority is not a clinical rating', () => {
    renderWithProviders(<TaskBoardPage />)
    expect(screen.getByText(/not a clinical urgency rating/i)).toBeInTheDocument()
  })

  it('filters the board by search text', async () => {
    const { user } = renderWithProviders(<TaskBoardPage />)

    await user.type(screen.getByRole('searchbox'), 'telemetry')

    expect(screen.getByText('Return telemetry box to biomedical engineering')).toBeInTheDocument()
    expect(
      screen.queryByText('Confirm transport scheduling for Demo Case A'),
    ).not.toBeInTheDocument()
    expect(screen.getByText(/Showing/)).toHaveTextContent('Showing 1 of 22 tasks')
  })

  it('filters by category through the select control', async () => {
    const { user } = renderWithProviders(<TaskBoardPage />)

    await user.selectOptions(screen.getByLabelText('Category'), 'education')

    expect(screen.getByText('Log annual competency completion for two staff members')).toBeInTheDocument()
    expect(screen.queryByText('Return telemetry box to biomedical engineering')).not.toBeInTheDocument()
  })

  it('shows an empty state and can clear all filters', async () => {
    const { user } = renderWithProviders(<TaskBoardPage />)

    await user.type(screen.getByRole('searchbox'), 'zzzz-no-match')
    expect(screen.getByText('No tasks match these filters')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(screen.queryByText('No tasks match these filters')).not.toBeInTheDocument()
  })

  it('validates and then creates a task through the drawer', async () => {
    const { user } = renderWithProviders(<TaskBoardPage />)
    const before = useDemoStore.getState().tasks.length

    await user.click(screen.getByRole('button', { name: 'New task' }))
    const dialog = await screen.findByRole('dialog')

    // Submitting an empty form surfaces validation rather than creating a task.
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }))
    expect(
      await within(dialog).findByText('Enter a task title with at least 3 characters.'),
    ).toBeInTheDocument()
    expect(useDemoStore.getState().tasks).toHaveLength(before)

    await user.type(
      within(dialog).getByLabelText(/Task title/),
      'Verify pager returns with the night charge nurse',
    )
    await user.selectOptions(within(dialog).getByLabelText('Category'), 'follow-up')
    await user.selectOptions(within(dialog).getByLabelText(/Assigned to/), 'm-priya')
    await user.click(within(dialog).getByRole('button', { name: 'Create task' }))

    const tasks = useDemoStore.getState().tasks
    expect(tasks).toHaveLength(before + 1)
    const created = tasks.find((t) => t.title === 'Verify pager returns with the night charge nurse')!
    expect(created.category).toBe('follow-up')
    expect(created.assigneeId).toBe('m-priya')
    expect(
      await screen.findByText('Verify pager returns with the night charge nurse'),
    ).toBeInTheDocument()
  })

  it('opens a task, changes its status, and records a note', async () => {
    const { user } = renderWithProviders(<TaskBoardPage />)

    await user.click(
      screen.getByRole('button', {
        name: 'Open task: Complete admission workflow packet for Demo Case B',
      }),
    )

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'In progress' }))
    expect(useDemoStore.getState().tasks.find((t) => t.id === 't-02')!.status).toBe('in-progress')

    await user.type(
      within(dialog).getByLabelText('Add a note'),
      'Demographic form verified with the unit clerk.',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Add note' }))

    const notes = useDemoStore.getState().tasks.find((t) => t.id === 't-02')!.notes
    expect(notes.at(-1)!.body).toBe('Demographic form verified with the unit clerk.')

    await user.click(within(dialog).getByRole('button', { name: 'Mark complete' }))
    expect(useDemoStore.getState().tasks.find((t) => t.id === 't-02')!.status).toBe('complete')
  })

  it('deletes a task after confirmation', async () => {
    const { user } = renderWithProviders(<TaskBoardPage />)

    await user.click(
      screen.getByRole('button', {
        name: 'Open task: Return telemetry box to biomedical engineering',
      }),
    )
    await user.click(await screen.findByRole('button', { name: 'Delete' }))
    await user.click(await screen.findByRole('button', { name: 'Delete task' }))

    expect(useDemoStore.getState().tasks.find((t) => t.id === 't-03')).toBeUndefined()
    expect(
      screen.queryByText('Return telemetry box to biomedical engineering'),
    ).not.toBeInTheDocument()
  })
})
