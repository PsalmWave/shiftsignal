import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'

import { App } from '@/app/App'
import { renderWithProviders, resetStore } from '@/test/utils'
import { useDemoStore } from '@/store/useDemoStore'

const template = (id: string) => useDemoStore.getState().templates.find((t) => t.id === id)!

beforeEach(() => {
  resetStore()
})

describe('Template workflows', () => {
  it('lists the seeded templates', () => {
    renderWithProviders(<App />, { route: '/templates' })

    expect(screen.getByRole('heading', { name: 'Reusable workflow templates' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Admission workflow' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Equipment handoff' })).toBeInTheDocument()
    expect(screen.getAllByText('Seeded template')).toHaveLength(6)
  })

  it('previews only the enabled steps', () => {
    renderWithProviders(<App />, { route: '/templates/tpl-shift-change' })

    // The seeded shift-change template ships with one step disabled.
    expect(screen.getByText('5 of 6 enabled')).toBeInTheDocument()

    // A disabled step stays in the editor but is absent from the preview column,
    // while an enabled step appears in both.
    expect(
      screen.getAllByText('Share the shift summary board with the incoming team'),
    ).toHaveLength(1)
    expect(screen.getAllByText('Draft the structured handoff record')).toHaveLength(2)
  })

  it('adds a step with validation', async () => {
    const { user } = renderWithProviders(<App />, { route: '/templates/tpl-equipment' })
    expect(screen.getByText('5 of 5 enabled')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add step' }))
    expect(await screen.findByText('Describe the step in at least 3 characters.')).toBeInTheDocument()
    expect(template('tpl-equipment').steps).toHaveLength(5)

    await user.type(screen.getByLabelText('Add a step'), 'Confirm the loading dock contact')
    await user.click(screen.getByRole('button', { name: 'Add step' }))

    expect(await screen.findByText('6 of 6 enabled')).toBeInTheDocument()
    expect(template('tpl-equipment').steps.at(-1)!.label).toBe('Confirm the loading dock contact')
  })

  it('disables a step so it is skipped in the preview', async () => {
    const { user } = renderWithProviders(<App />, { route: '/templates/tpl-equipment' })

    await user.click(
      screen.getByRole('checkbox', {
        name: 'Enable step: Inventory the devices currently assigned to the unit',
      }),
    )

    expect(await screen.findByText('4 of 5 enabled')).toBeInTheDocument()
    expect(template('tpl-equipment').steps[0].enabled).toBe(false)
  })

  it('reorders steps with the move controls', async () => {
    const { user } = renderWithProviders(<App />, { route: '/templates/tpl-equipment' })
    const originalFirst = template('tpl-equipment').steps[0]

    await user.click(screen.getByRole('button', { name: `Move down: ${originalFirst.label}` }))

    expect(template('tpl-equipment').steps[1].id).toBe(originalFirst.id)
    expect(
      screen.getByRole('button', { name: `Move up: ${template('tpl-equipment').steps[0].label}` }),
    ).toBeDisabled()
  })

  it('removes a step', async () => {
    const { user } = renderWithProviders(<App />, { route: '/templates/tpl-equipment' })
    const target = template('tpl-equipment').steps.at(-1)!

    await user.click(screen.getByRole('button', { name: `Remove step: ${target.label}` }))

    expect(template('tpl-equipment').steps).toHaveLength(4)
    expect(template('tpl-equipment').steps.some((s) => s.id === target.id)).toBe(false)
  })

  it('duplicates a template into an editable copy', async () => {
    const { user } = renderWithProviders(<App />, { route: '/templates/tpl-equipment' })

    await user.click(screen.getByRole('button', { name: 'Duplicate' }))

    const copy = useDemoStore.getState().templates.find((t) => t.name === 'Equipment handoff (copy)')!
    expect(copy.isSeeded).toBe(false)
    expect(await screen.findByRole('heading', { name: 'Equipment handoff (copy)' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('does not offer deletion for seeded templates', () => {
    renderWithProviders(<App />, { route: '/templates/tpl-equipment' })
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument()
    expect(screen.getByText(/This is a seeded demo template/i)).toBeInTheDocument()
  })

  it('starts a checklist from the template and navigates to it', async () => {
    const { user } = renderWithProviders(<App />, { route: '/templates/tpl-equipment' })
    const before = useDemoStore.getState().checklists.length

    await user.click(screen.getByRole('button', { name: 'Start checklist' }))
    const dialog = await screen.findByRole('dialog')
    await user.clear(within(dialog).getByLabelText(/Checklist title/))
    await user.type(within(dialog).getByLabelText(/Checklist title/), 'Equipment handoff — Demo Case F')
    await user.click(within(dialog).getByRole('button', { name: 'Start checklist' }))

    expect(useDemoStore.getState().checklists).toHaveLength(before + 1)
    expect(
      await screen.findByRole('heading', { name: 'Equipment handoff — Demo Case F' }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 of 5 steps complete')).toBeInTheDocument()
  })

  it('shows a recoverable empty state for an unknown template id', () => {
    renderWithProviders(<App />, { route: '/templates/nope' })
    expect(screen.getByText('Template not found')).toBeInTheDocument()
  })
})
