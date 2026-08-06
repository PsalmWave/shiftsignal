import { beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'

import { HandoffPage } from './HandoffPage'
import { renderWithProviders, resetStore } from '@/test/utils'
import { useDemoStore } from '@/store/useDemoStore'

const handoff = (id: string) => useDemoStore.getState().handoffs.find((h) => h.id === id)!

beforeEach(() => {
  resetStore()
})

describe('HandoffPage', () => {
  it('opens the most recently updated record and shows the safety boundary', () => {
    renderWithProviders(<HandoffPage />)

    expect(screen.getByRole('heading', { level: 2, name: 'Day shift charge handoff' })).toBeInTheDocument()
    expect(screen.getByText(/Not a clinical handoff of record/i)).toBeInTheDocument()
  })

  it('renders all six structured sections', () => {
    renderWithProviders(<HandoffPage />)

    for (const label of [
      'Situation',
      'Background',
      'Outstanding administrative tasks',
      'Communication completed',
      'Follow-up needed',
      'Questions for next shift',
    ]) {
      expect(screen.getByRole('heading', { level: 3, name: new RegExp(`^${label}`) })).toBeInTheDocument()
    }
  })

  it('blocks marking ready until the required sections are filled', async () => {
    const { user } = renderWithProviders(<HandoffPage />)

    await user.click(screen.getByRole('button', { name: 'Mark ready' }))

    expect(await screen.findByText('This section is required before handoff.')).toBeInTheDocument()
    expect(handoff('h-01').status).toBe('draft')

    await user.type(
      screen.getByLabelText('Background'),
      'Transport request was submitted at 14:10 and the confirmation number is pending.',
    )
    await user.click(screen.getByRole('button', { name: 'Mark ready' }))

    expect(handoff('h-01').status).toBe('ready')
    expect(handoff('h-01').sections.background).toContain('confirmation number is pending')
  })

  it('saves a draft only when there are unsaved changes', async () => {
    const { user } = renderWithProviders(<HandoffPage />)

    expect(screen.getByRole('button', { name: 'Saved' })).toBeDisabled()

    await user.type(screen.getByLabelText('Questions for next shift'), 'Who owns the pager log?')
    const saveButton = screen.getByRole('button', { name: 'Save draft' })
    expect(saveButton).toBeEnabled()

    await user.click(saveButton)
    expect(handoff('h-01').sections.questions).toBe('Who owns the pager log?')
    expect(screen.getByRole('button', { name: 'Saved' })).toBeDisabled()
  })

  it('links an open task into the handoff packet', async () => {
    const { user } = renderWithProviders(<HandoffPage />)

    expect(handoff('h-01').linkedTaskIds).not.toContain('t-06')
    await user.click(screen.getByRole('checkbox', { name: /Update unit assignment board/ }))
    expect(handoff('h-01').linkedTaskIds).toContain('t-06')
  })

  it('renders a read-only preview of the packet', async () => {
    const { user } = renderWithProviders(<HandoffPage />)

    await user.click(screen.getByRole('button', { name: 'Preview' }))

    // h-01 leaves four of the six sections empty, each shown as "Not documented".
    expect(screen.getAllByText('Not documented')).toHaveLength(4)
    expect(screen.getByText(/administrative workflow organization only/i)).toBeInTheDocument()
    expect(screen.queryByLabelText('Background')).not.toBeInTheDocument()
  })

  it('marks a record handed off and locks it', async () => {
    const { user } = renderWithProviders(<HandoffPage />)

    await user.click(screen.getByRole('button', { name: 'Mark handed off' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Confirm handoff' }))

    const record = handoff('h-01')
    expect(record.status).toBe('handed-off')
    expect(record.handedOffAt).not.toBeNull()

    expect(screen.queryByRole('button', { name: 'Mark handed off' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save draft' })).not.toBeInTheDocument()
    expect(screen.getAllByText(/Handed off/).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Copy handoff text' })).toBeInTheDocument()
  })

  it('creates a new handoff draft with validation', async () => {
    const { user } = renderWithProviders(<HandoffPage />)
    const before = useDemoStore.getState().handoffs.length

    await user.click(screen.getByRole('button', { name: 'New handoff' }))
    const dialog = await screen.findByRole('dialog')

    await user.click(within(dialog).getByRole('button', { name: 'Create draft' }))
    expect(
      await within(dialog).findByText('Give the handoff a short title with at least 3 characters.'),
    ).toBeInTheDocument()
    expect(useDemoStore.getState().handoffs).toHaveLength(before)

    await user.type(within(dialog).getByLabelText(/Handoff title/), 'Evening coordination handoff')
    await user.click(within(dialog).getByRole('button', { name: 'Create draft' }))

    const handoffs = useDemoStore.getState().handoffs
    expect(handoffs).toHaveLength(before + 1)
    expect(handoffs.some((h) => h.title === 'Evening coordination handoff')).toBe(true)
  })

  it('logs handoff changes in the record activity list', async () => {
    const { user } = renderWithProviders(<HandoffPage />)

    await user.type(screen.getByLabelText('Situation'), ' Updated at shift change.')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))

    expect(await screen.findByText('Saved changes to "Day shift charge handoff"')).toBeInTheDocument()
  })
})
