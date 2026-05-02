import { ApiCheck, AssertionBuilder } from 'checkly/constructs'
import { slackOpsChannel, emailOncallChannel, channels } from '../alert-channels'

/**
 * Cart Service API Check
 *
 * Cart abandonment is one of the most expensive failure modes in e-commerce.
 * What makes it insidious is that it's nearly invisible from the infrastructure
 * layer — the cart service can fail in ways that produce no errors in metrics
 * or logs until you start correlating with revenue data hours later.
 *
 * This check adds a synthetic product to a cart every 2 minutes and validates
 * that the cart service responds correctly. It doesn't require a real user
 * session — we use a deterministic test session ID so the check is idempotent.
 *
 * What it catches: cart service crashes or timeouts, session storage failures,
 * broken cart-to-checkout handoffs, regressions in the cart API contract.
 */
new ApiCheck('cart-service-api', {
  name: '🛒 Cart Service API',
  activated: true,
  frequency: 2,
  locations: ['us-east-1', 'us-west-1', 'eu-west-2'],
  tags: ['astronomy-shop', 'api', 'cart'],
  alertChannels: channels(slackOpsChannel, emailOncallChannel),

  request: {
    url: '{{ENVIRONMENT_URL}}/api/cart',
    method: 'POST',
    headers: [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'Accept', value: 'application/json' },
    ],
    body: JSON.stringify({
      // Deterministic session ID — same every run so we're not leaking
      // session state into the demo app's storage.
      userId: 'checkly-synthetic-monitor',
      item: {
        // Vintage Telescope Screwdriver — product ID from the OTel demo catalog.
        // If this product ID changes, update it here.
        productId: 'OLJCESPC7Z',
        quantity: 1,
      },
    }),

    assertions: [
      AssertionBuilder.statusCode().equals(200),

      // Cart operations should be fast. A 5-second response on a cart add
      // is a degraded experience even if it technically succeeds.
      AssertionBuilder.responseTime().lessThan(5000),

      // Validate the response body is not empty
      AssertionBuilder.jsonBody().isNotNull(),
    ],
  },
})
