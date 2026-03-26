import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router'

import { Refresh16Icon } from '@oxide/design-system/icons/react'

const SickFace = () => (
  <div className="bg-error/10 flex h-16 w-16 items-center justify-center rounded-full">
    <svg viewBox="0 0 107 100" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd'}}>
      <path d="M38.598,29.738l28.219,-9.246l25.906,11.023c2.336,5.351 3.633,11.262 3.633,17.473c-0,24.141 -19.598,43.734 -43.734,43.734c-24.141,-0 -43.738,-19.598 -43.738,-43.734c-0,-3.399 0.386,-6.703 1.121,-9.879l20.727,-6.789c-0.004,0.121 -0.008,0.246 -0.008,0.371c-0,3.449 1.875,6.25 4.183,6.25c2.309,-0 4.184,-2.801 4.184,-6.25c0,-1.066 -0.18,-2.07 -0.496,-2.949l0.003,-0.004Zm40.387,40.402c-8.625,-8.492 -17.363,-12.703 -26.141,-12.73c-8.766,-0.027 -17.648,4.125 -26.57,12.715c-0.778,0.746 -0.801,1.984 -0.051,2.762c0.746,0.777 1.984,0.8 2.762,0.05c8.035,-7.738 15.953,-11.648 23.848,-11.625c7.886,0.024 15.66,3.977 23.41,11.609c0.769,0.758 2.004,0.747 2.761,-0.019c0.758,-0.77 0.746,-2.004 -0.019,-2.762l-0,0Zm-8.649,-43.703c-2.308,0 -4.183,2.801 -4.183,6.246c-0,3.449 1.875,6.25 4.183,6.25c2.309,0 4.184,-2.801 4.184,-6.25c-0,-3.449 -1.875,-6.246 -4.184,-6.246Z" style={{fill:'currentColor'}}/>
      <path d="M22.164,17.605c1.699,-1.648 3.531,-3.16 5.476,-4.52c3,-2.093 6.274,-3.816 9.754,-5.113l6.164,2.621l-21.394,7.012Z" style={{fill:'currentColor'}}/>
      <path d="M11.32,34.566c1.008,-2.887 2.313,-5.637 3.875,-8.211c0.625,-1.031 1.293,-2.035 1.996,-3.008l31.824,-10.426l12.344,5.25l-50.039,16.395Z" style={{fill:'currentColor'}}/>
      <path d="M43.305,6.242c3.004,-0.652 6.117,-0.996 9.316,-0.996c3.445,0 6.797,0.399 10.012,1.152c3.34,0.786 6.535,1.95 9.531,3.454c2.532,1.269 4.922,2.773 7.145,4.488c1.902,1.469 3.683,3.094 5.32,4.848c1.961,2.105 3.715,4.402 5.235,6.859l-46.559,-19.809l-0,0.004Z" style={{fill:'currentColor'}}/>
    </svg>
  </div>
)

function ErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error
  resetErrorBoundary: () => void
}) {
  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center p-12 text-center">
      <div className="border-error/20 bg-error/5 flex max-w-md flex-col items-center gap-5 rounded-xl border p-10">
        <SickFace />

        <div className="space-y-2">
          <h2 className="text-sans-xl text-raise">Something went wrong</h2>
          <p className="text-sans-md text-secondary">
            We hit an unexpected snag. Your data is safe — give it another try or
            refresh the page.
          </p>
        </div>

        {error?.message && (
          <p className="text-mono-xs text-quaternary bg-raise w-full rounded-lg px-4 py-3 text-left break-words">
            {error.message}
          </p>
        )}

        <button
          onClick={resetErrorBoundary}
          className="text-sans-md text-accent hover:text-accent-hover flex items-center gap-1.5"
        >
          <Refresh16Icon /> Try again
        </button>
      </div>
    </div>
  )
}

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  )
}

/** Used as `errorElement` in the React Router route config. */
export function RouteErrorBoundary() {
  const error = useRouteError()
  const navigate = useNavigate()

  const is404 =
    isRouteErrorResponse(error) && error.status === 404

  const title = is404 ? 'Page not found' : 'Something went wrong'
  const message = is404
    ? "That page doesn't exist. It may have moved, or you may have followed a bad link."
    : "We hit an unexpected snag. Your data is safe — give it another try or refresh the page."
  const detail =
    isRouteErrorResponse(error)
      ? `${error.status} ${error.statusText}`
      : error instanceof Error
        ? error.message
        : undefined

  return (
    <div className="flex h-full min-h-64 flex-col items-center justify-center p-12 text-center">
      <div className="border-error/20 bg-error/5 flex max-w-md flex-col items-center gap-5 rounded-xl border p-10">
        <SickFace />

        <div className="space-y-2">
          <h2 className="text-sans-xl text-raise">{title}</h2>
          <p className="text-sans-md text-secondary">{message}</p>
        </div>

        {detail && (
          <p className="text-mono-xs text-quaternary bg-raise w-full rounded-lg px-4 py-3 text-left break-words">
            {detail}
          </p>
        )}

        <button
          onClick={() => navigate(-1)}
          className="text-sans-md text-accent hover:text-accent-hover flex items-center gap-1.5"
        >
          <Refresh16Icon /> Go back
        </button>
      </div>
    </div>
  )
}
