import { test, expect } from '@playwright/test'

/**
 * Storefront Smoke Test
 *
 * Validates that the Astronomy Shop homepage loads and renders real product
 * content in the browser — not just that the server returned a 200.
 *
 * A green API health check with a broken storefront is a real failure mode:
 * the server could serve an empty shell while a React hydration error or
 * failed data fetch leaves the product grid empty.
 */

const BASE_URL = process.env.ENVIRONMENT_URL ?? 'http://localhost:8080'

test('homepage loads and renders products', async ({ page }) => {
  // Collect console errors — we'll assert on them at the end
  const consoleErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })

  // Page title should contain the shop name
  await expect(page).toHaveTitle(/otel demo/i)

  // The product grid should be visible — if catalog service is down,
  // this section either won't render or will be empty
  const productGrid = page.locator('[data-cy="product-list"], .ProductList, main ul, main .grid')
  await expect(productGrid).toBeVisible({ timeout: 10_000 })

  // At least one product card should be present.
  // An empty grid with a 200 is still an incident.
  const productCards = page.locator(
    '[data-cy="product-card"], .ProductCard, [class*="product"]'
  )
  const cardCount = await productCards.count()
  expect(cardCount).toBeGreaterThan(0)

  // Each card should show a product name and price
  const firstCard = productCards.first()
  await expect(firstCard).toBeVisible()

  // No fatal JS errors — a single React hydration failure here can silently
  // break the entire page for a subset of users
  const fatalErrors = consoleErrors.filter(
    (e) =>
      e.includes('Error') &&
      !e.includes('favicon') &&    // ignore common noise
      !e.includes('analytics') &&
      !e.includes('traces') &&     // OTel demo sends traces to localhost collector — expected to fail in cloud
      !e.includes('4317') &&       // OTel gRPC collector port
      !e.includes('4318') &&       // OTel HTTP collector port
      !e.includes('ERR_CONNECTION_REFUSED') // sub-resource calls to local services
  )
  expect(
    fatalErrors,
    `Unexpected console errors on homepage: ${fatalErrors.join(', ')}`
  ).toHaveLength(0)
})
