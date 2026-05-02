import { test, expect } from '@playwright/test'

/**
 * Product Discovery Journey
 *
 * Walks the user flow: homepage → product list → product detail page.
 *
 * This catches a class of failures that pure API checks miss: the catalog
 * API can return valid JSON while the product detail page is broken due to
 * a rendering error, a missing image service, or a schema mismatch between
 * the API response and what the frontend expects.
 */

const BASE_URL = process.env.ENVIRONMENT_URL ?? 'http://localhost:8080'

// The Vintage Telescope product — hardcoded so this check is deterministic.
// If you rename or remove this product from the demo, update this value.
const TARGET_PRODUCT_NAME = /telescope/i

test('user can browse from homepage to product detail page', async ({ page }) => {
  // ── Step 1: Load the homepage ──────────────────────────────────────────────
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveTitle(/otel demo/i)

  // ── Step 2: Find and click a product ──────────────────────────────────────
  // We look for a product matching our target name. Using text matching is
  // more resilient than a fixed CSS selector — it survives layout changes.
  const productLink = page
    .getByRole('link', { name: TARGET_PRODUCT_NAME })
    .first()

  await expect(productLink).toBeVisible({ timeout: 10_000 })
  await productLink.click()

  // ── Step 3: Validate the product detail page ───────────────────────────────
  // URL should change to a product page
  await expect(page).toHaveURL(/\/product\//, { timeout: 10_000 })

  // Product name should be visible on the detail page
  const productName = page.getByRole('heading', { name: TARGET_PRODUCT_NAME })
  await expect(productName).toBeVisible()

  // Price must be rendered — a missing price is a broken UX even if the
  // page technically loaded
  const priceEl = page.locator('[data-cy="product-price"], .ProductDetail-price, [class*="price"]')
  await expect(priceEl.first()).toBeVisible()

  // The "Add to Cart" button must be present and enabled — if it's missing,
  // the user literally cannot buy anything from this page
  const addToCartBtn = page.getByRole('button', { name: /add to cart/i })
  await expect(addToCartBtn).toBeVisible()
  await expect(addToCartBtn).toBeEnabled()
})
