import { test as base, expect } from '@playwright/test'

// Desktop runs attach to the current Chrome profile. CI uses its own disposable browser.
export const test = base.extend({
  browser: [async ({ playwright }, provide) => {
    const browser = process.env.E2E_CDP_URL
      ? await playwright.chromium.connectOverCDP(process.env.E2E_CDP_URL, { noDefaults: true })
      : await playwright.chromium.launch({ headless: true })
    try { await provide(browser) }
    finally { await browser.close() }
  }, { scope: 'worker' }],
  context: async ({ browser }, provide) => {
    if (process.env.E2E_CDP_URL) {
      await provide(browser.contexts()[0])
    } else {
      const context = await browser.newContext()
      try { await provide(context) }
      finally { await context.close() }
    }
  },
})
export { expect }
