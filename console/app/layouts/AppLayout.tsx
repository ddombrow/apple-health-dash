import { Outlet } from 'react-router'

import { ErrorBoundary } from '~/components/ErrorBoundary'
import { Sidebar } from '~/components/Sidebar'

export function AppLayout() {
  return (
    <div className="grid h-screen grid-cols-[14.25rem_1fr]">
      <Sidebar />
      <div className="flex flex-col overflow-auto">
        <main className="flex grow flex-col">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
