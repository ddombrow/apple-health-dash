export async function startMockAPI() {
  const { worker } = await import('../mock-api/msw/browser')
  await worker.start({ onUnhandledRequest: 'warn' })
}
