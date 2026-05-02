import { BrowserCheck } from 'checkly/constructs'
import * as path from 'path'
import { slackOpsChannel, emailOncallChannel, channels } from '../alert-channels'

/**
 * Product Discovery Check
 *
 * Simulates a user browsing from the homepage to a product detail page.
 * This validates the catalog service at the UI layer — specifically catching
 * the failure mode where the product list renders but clicking into a product
 * returns an error or a broken page.
 *
 * Also validates that product details (name, price, add-to-cart button) render
 * correctly, since those come from a separate catalog service call.
 */
new BrowserCheck('product-discovery', {
  name: '🔭 Product Discovery Journey',
  activated: true,
  frequency: 5,
  locations: ['us-east-1', 'us-west-1', 'eu-west-2'],
  tags: ['astronomy-shop', 'browser', 'catalog'],
  alertChannels: channels(slackOpsChannel, emailOncallChannel),
  code: {
    entrypoint: path.join(__dirname, 'product-discovery.spec.ts'),
  },
})
