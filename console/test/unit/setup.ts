/**
 * This file is run by vitest before any tests are run. Configuration
 * in this file does _not_ impact end-to-end tests.
 */
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from '../../mock-api/msw/server'

HTMLCanvasElement.prototype.getContext = () => null

beforeAll(() => server.listen())
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
