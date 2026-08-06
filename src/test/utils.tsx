import type { ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { ToastProvider } from '@/components/ui/Toast'
import { useDemoStore } from '@/store/useDemoStore'
import { buildSeedState } from '@/data/seed'

/** Restores the store to a freshly seeded dataset. Call in `beforeEach`. */
export function resetStore(): void {
  useDemoStore.setState(buildSeedState())
}

interface Options extends Omit<RenderOptions, 'wrapper'> {
  route?: string
}

/** Renders `ui` inside the router + toast providers the app requires. */
export function renderWithProviders(ui: ReactElement, { route = '/', ...options }: Options = {}) {
  const user = userEvent.setup()
  const result = render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        <ToastProvider>{children}</ToastProvider>
      </MemoryRouter>
    ),
    ...options,
  })
  return { user, ...result }
}
