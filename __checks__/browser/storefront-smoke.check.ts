import { BrowserCheck } from 'checkly/constructs'
import * as path from 'path'
import { slackOpsChannel, channels } from '../alert-channels'

/**
 * Storefront Smoke Check
 *
 * The fastest browser-level signal that the frontend is working for real users.
 * This is different from the API health check — the API check verifies the
 * server responds; this check verifies the page actually renders products
 * in the browser, with no fatal JS errors.
 *
 * Runs every 5 minutes from 3 regions. If this fails, everything downstream
 * (discovery, checkout) is also broken — so failing fast here reduces noise.
 */
new BrowserCheck('storefront-smoke', {
  name: '🏠 Storefront Smoke Test',
  activated: true,
  frequency: 5,
  locations: ['us-east-1', 'us-west-1', 'eu-west-2'],
  tags: ['astronomy-shop', 'browser', 'smoke'],
  alertChannels: channels(slackOpsChannel),
  code: {
    entrypoint: path.join(__dirname, 'storefront-smoke.spec.ts'),
  },
})
