import { Api } from './__generated__/Api'
import type { ApiResult } from './__generated__/http-client'

export const api = new Api()

export * from './__generated__/Api'

/** Unwrap an ApiResult, throwing on error so React Query catches it. */
export function unwrap<T>(result: ApiResult<T>): T {
  if (result.type === 'success') return result.data
  if (result.type === 'error') throw new Error(result.data.message)
  throw result.error
}
