import type { RouteObject } from 'react-router'

import { RouteErrorBoundary } from './components/ErrorBoundary'
import { AppLayout } from './layouts/AppLayout'
import { AboutPage } from './pages/AboutPage'
import { HomePage } from './pages/HomePage'

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/about',
        element: <AboutPage />,
      },
      {
        path: '*',
        element: <RouteErrorBoundary />,
      },
    ],
  },
]
