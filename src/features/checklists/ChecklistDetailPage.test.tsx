import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'

import { App } from '@/app/App'
import { renderWithProviders, resetStore } from '@/test/utils'
import { useDemoStore } from '@/store/useDemoStore'

const checklist = (id: string) => useDemoStore.getState().checklists.find((c) => c.id === id)!

beforeEach(() => {
  resetStore()
})

describe('Checklist workflows', () => {
  it('lists checklists with progress and a documentation summary', () => {
    renderWithProviders(<App />, { route: '/checklists' })

    expect(screen.getByRole('heading', { name: 'Workflow checklists' })).toBeInTheDocument()
    expect(screen.getByText('Admission workflow — Demo Case B')).toBeInTheDocument()
    expect(screen.getByText('4 of 7 steps')).toBeInTheDocument()
    expect(screen.getByText(/Workflow tracking, not documentation of record/i)).toBeInTheDocument()
  })

  it('filters the list by status', async () => {
    const { user } = renderWithProviders(<App />, { route: '/checklists' })

    await user.click(screen.getByRole('button', { name: 'Complete' }))

    expect(screen.getByText('Equipment handoff — Demo Case C')).toBeInTheDocument()
    expect(screen.queryByText('Admission workflow — Demo Case B')).not.toBeInTheDocument()
  })

  it('completes a step and advances the progress indicator', async () => {
    const { user } = renderWithProviders(<App />, { route: '/checklists/cl-01' })

    expect(screen.getByText('4 of 7 steps complete')).toBeInTheDocument()

    await user.click(screen.getByLabelText('Assemble the paper chart insert packet'))

    expect(await screen.findByText('5 of 7 steps complete')).toBeInTheDocument()
    const updated = checklist('cl-01')
    expect(updated.steps[4].complete).toBe(true)
    expect(updated.steps[4].completedAt).not.toBeNull()
  })

  it('reopens a completed step', async () => {
    const { user } = renderWithProviders(<App />, { route: '/checklists/cl-01' })

    await user.click(screen.getByLabelText('Acknowledge the arrival notification in the intake queue'))

    expect(await screen.findByText('3 of 7 steps complete')).toBeInTheDocument()
    expect(checklist('cl-01').steps[0].complete).toBe(false)
    expect(checklist('cl-01').steps[0].completedAt).toBeNull()
  })

  it('assigns an owner and a note to a step', async () => {
    const { user } = renderWithProviders(<App />, { route: '/checklists/cl-01' })

    await user.selectOptions(
      screen.getByLabelText('Assign step: Notify assigned team members of the new assignment'),
      'm-joyce',
    )
    await user.type(
      screen.getByLabelText('Note for step: Notify assigned team members of the new assignment'),
      'Announced at the 15:00 huddle.',
    )

    const step = checklist('cl-01').steps[5]
    expect(step.assigneeId).toBe('m-joyce')
    expect(step.note).toBe('Announced at the 15:00 huddle.')
  })

  it('creates a checklist from a template with validation', async () => {
    const { user } = renderWithProviders(<App />, { route: '/checklists' })
    const before = useDemoStore.getState().checklists.length

    await user.click(screen.getByRole('button', { name: 'New checklist' }))
    const dialog = await screen.findByRole('dialog')

    await user.click(within(dialog).getByRole('button', { name: 'Start checklist' }))
    expect(
      await within(dialog).findByText('Give this checklist a title with at least 3 characters.'),
    ).toBeInTheDocument()
    expect(useDemoStore.getState().checklists).toHaveLength(before)

    await user.selectOptions(within(dialog).getByLabelText('Workflow template'), 'tpl-transfer')
    await user.type(
      within(dialog).getByLabelText(/Checklist title/),
      'Transfer workflow — Demo Case F',
    )
    await user.click(within(dialog).getByRole('button', { name: 'Start checklist' }))

    const checklists = useDemoStore.getState().checklists
    expect(checklists).toHaveLength(before + 1)
    const created = checklists.find((c) => c.title === 'Transfer workflow — Demo Case F')!
    expect(created.kind).toBe('transfer')
    expect(created.steps.every((step) => !step.complete)).toBe(true)
  })

  it('archives a checklist and makes its steps read-only', async () => {
    const { user } = renderWithProviders(<App />, { route: '/checklists/cl-05' })

    await user.click(screen.getByRole('button', { name: 'Archive' }))

    expect(checklist('cl-05').status).toBe('archived')
    expect(screen.getByLabelText('Review every open task and refresh its status')).toBeDisabled()
  })

  it('shows a recoverable empty state for an unknown checklist id', () => {
    renderWithProviders(<App />, { route: '/checklists/does-not-exist' })

    expect(screen.getByText('Checklist not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to checklists' })).toBeInTheDocument()
  })
})
