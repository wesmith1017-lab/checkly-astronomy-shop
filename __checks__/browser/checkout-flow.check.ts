import { BrowserCheck } from 'checkly/constructs'
import * as path from 'path'
import {
  slackOpsChannel,
  emailOncallChannel,
  pagerdutyCheckoutChannel,
  channels,
} from '../alert-channels'

/**
 * Checkout Flow Check — REVENUE CRITICAL
 *
 * This is the most important check in this project. It exercises the entire
 * purchase path: product selection → add to cart → checkout form → order
 * confirmation. Any break in this chain is a direct, measurable revenue impact.
 *
 * Why 10-minute frequency (not 5)?
 * The checkout flow makes real service calls across Cart, Checkout, Payment,
 * Shipping, Email, and Currency services. Running it every 5 minutes would
 * create meaningful load. 10 minutes is the right balance between detection
 * speed and overhead on the demo environment.
 *
 * Why only 2 regions (not 3)?
 * Same reasoning — reducing unnecessary load on the checkout pipeline.
 * US-East + EU-West still gives us geographic coverage for the demo.
 *
 * Alert routing: Slack + Email + PagerDuty.
 * This is the only check wired to PagerDuty. Routing everything to PagerDuty
 * creates alert fatigue and dilutes the urgency of a real checkout failure.
 */
new BrowserCheck('checkout-flow', {
  name: '💳 Full Checkout Flow',
  activated: true,
  frequency: 10,
  // Two regions only — see rationale above
  locations: ['us-east-1', 'eu-west-2'],
  tags: ['astronomy-shop', 'browser', 'checkout', 'revenue-critical'],
  alertChannels: channels(slackOpsChannel, emailOncallChannel, pagerdutyCheckoutChannel),
  // Give the checkout flow more time — it hits multiple backend services
  timeoutSeconds: 120,
  code: {
    entrypoint: path.join(__dirname, 'checkout-flow.spec.ts'),
  },
})
