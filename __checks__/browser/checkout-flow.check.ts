import { BrowserCheck } from 'checkly/constructs'
import * as path from 'path'
import {
  slackOpsChannel,
  emailOncallChannel,
  pagerdutyCheckoutChannel,
  channels,
} from '../alert-channels'
import { browserGroup } from '../groups'

/**
 * Checkout Flow Check -- REVENUE CRITICAL
 *
 * This is the most important check in the suite. It exercises the entire
 * purchase path end-to-end: homepage -> product selection -> add to cart ->
 * place order -> order confirmation. The OTel Demo submits the order immediately
 * on "Place Order" click using pre-configured demo payment details -- there is
 * no separate checkout form. Any break in this chain is a direct, measurable
 * revenue impact across 7 backend services.
 *
 * Why 10-minute frequency (not 5)?
 * The checkout flow makes real service calls across Cart, Checkout, Payment,
 * Shipping, Email, and Currency services. Running it every 5 minutes would
 * create meaningful synthetic load. 10 minutes is the right balance between
 * detection speed and overhead on the demo environment.
 *
 * Why only 2 regions (not 3)?
 * Same reasoning -- limiting unnecessary load on the checkout pipeline.
 * US-East + EU-West still provides geographic coverage for the demo.
 *
 * Alert routing: Slack + Email + PagerDuty.
 * This is the only check wired to PagerDuty. Routing every check to PagerDuty
 * creates alert fatigue and dilutes the urgency of a real checkout outage.
 *
 * Retry strategy:
 * Inherited from browserGroup (2 retries, 60s fixed, different region each time).
 * Two retries before a PagerDuty alert fires means we have confirmed the failure
 * three times across three different cloud locations -- that is a real outage,
 * not a tunnel hiccup.
 */
new BrowserCheck('checkout-flow', {
  name: '💳 Full Checkout Flow',
  activated: true,
  frequency: 10,
  // Two regions only -- see rationale above
  locations: ['us-east-1', 'eu-west-2'],
  tags: ['astronomy-shop', 'browser', 'checkout', 'revenue-critical'],
  group: browserGroup,
  alertChannels: channels(slackOpsChannel, emailOncallChannel, pagerdutyCheckoutChannel),
  // 3-minute check timeout, matching the spec's test.setTimeout(180_000).
  // The check-level timeout must be >= the Playwright test timeout or Checkly
  // will kill the runner before the spec's own timeout can fire gracefully.
  timeoutSeconds: 180,
  code: {
    entrypoint: path.join(__dirname, 'checkout-flow.spec.ts'),
  },
})
