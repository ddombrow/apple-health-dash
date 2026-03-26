import { useLocation, useResolvedPath } from 'react-router'

interface ActivePathOptions {
  to: string
  end?: boolean
}

export const useIsActivePath = ({ to, end }: ActivePathOptions) => {
  const path = useResolvedPath(to)
  const location = useLocation()

  const toPathname = path.pathname
  const locationPathname = location.pathname

  return (
    locationPathname === toPathname ||
    (!end &&
      locationPathname.startsWith(toPathname) &&
      locationPathname.charAt(toPathname.length) === '/')
  )
}
