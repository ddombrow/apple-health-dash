import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { queryClient } from '~/api/client'

// this is the only allowed css import
// eslint-disable-next-line no-restricted-imports
import '~/styles/index.css'
import { startMockAPI } from './msw-mock-api'
import { routes } from './routes'

if (process.env.SHA) {
  console.info('AHealth Console version', process.env.SHA)
}

const root = createRoot(document.getElementById('root')!)

function render() {
  const router = createBrowserRouter(routes, {
    basename: import.meta.env.PROD ? '/console' : undefined,
  })

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </StrictMode>
  )
}

if (process.env.MSW) {
  startMockAPI().then(render)
} else {
  render()
}
