import { randomBytes } from 'crypto'

import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { z } from 'zod/v4'

const KiB = 1024

const ApiMode = z.enum(['msw', 'remote'])

function bail(msg: string): never {
  console.error(msg)
  process.exit(1)
}

const apiModeResult = ApiMode.default('msw').safeParse(process.env.API_MODE)
if (!apiModeResult.success) {
  const options = ApiMode.options.join(', ')
  bail(`Error: API_MODE must be one of: [${options}]. If unset, default is "msw".`)
}

const apiMode = apiModeResult.data

if (apiMode === 'remote' && !process.env.EXT_HOST) {
  bail(`Error: EXT_HOST is required when API_MODE=remote.`)
}

const EXT_HOST = process.env.EXT_HOST

const baseHeaders = {
  'content-security-policy': `default-src 'self'; style-src 'unsafe-inline' 'self'; frame-src 'none'; object-src 'none'; form-action 'none'; frame-ancestors 'none'`,
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
}

// This is only needed for local dev to avoid breaking Vite's script injection.
// Rather than use unsafe-inline all the time, the nonce approach is much more
// narrowly scoped and lets us make sure everything *else* works fine without
// unsafe-inline.
const cspNonce = randomBytes(8).toString('hex')
const devHeaders = {
  ...baseHeaders,
  'content-security-policy': `${baseHeaders['content-security-policy']}; script-src 'nonce-${cspNonce}' 'self'`,
}

// see https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/console/' : '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        experimentalMinChunkSize: 30 * KiB,
      },
    },
    // prevent inlining assets as `data:`, which is not permitted by our Content-Security-Policy
    assetsInlineLimit: 0,
  },
  define: {
    'process.env.MSW': JSON.stringify(apiMode === 'msw'),
    'process.env.MSW_BANNER': JSON.stringify(apiMode === 'msw' && mode === 'production'),
    'process.env.SHA': JSON.stringify(process.env.SHA),
    'process.env.CHAOS': JSON.stringify(mode !== 'production' && process.env.CHAOS),
  },
  clearScreen: false,
  plugins: [tailwindcss(), tsconfigPaths(), react(), apiMode === 'remote' && basicSsl()],
  html: {
    // use a CSP nonce in dev so Vite can tag its injected scripts — avoids needing 'unsafe-inline'
    cspNonce: mode === 'production' ? undefined : cspNonce,
  },
  server: {
    port: 4000,
    headers: devHeaders,
    proxy: {
      '/api': {
        target: apiMode === 'remote' ? `https://${EXT_HOST}` : 'http://localhost:4001',
        changeOrigin: true,
      },
      '/mileage': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  preview: { headers: baseHeaders },
  test: {
    environment: 'jsdom',
    setupFiles: ['test/unit/setup.ts'],
    includeSource: ['app/**/*.ts'],
  },
}))
