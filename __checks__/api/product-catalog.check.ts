import { ApiCheck, AssertionBuilder } from 'checkly/constructs'
import { slackOpsChannel, emailOncallChannel, channels } from '../alert-channels'

/**
 * Product Catalog API Check
 *
 * Validates that the product catalog service is returning actual product data.
 * This is the most common failure mode that goes undetected by infrastructure
 * metrics: the frontend still loads, the load balancer reports 200s, but the
 * catalog service returns an empty array — so every user sees a blank product
 * grid.
 *
 * This is the exact failure pattern the prospect described: "customers noticed
 * before we did." A blank storefront with a green dashboard.
 *
 * What it catches: catalog service crashes, empty catalog responses, data
 * pipeline failures upstream of the catalog service, schema regressions
 * (e.g., a deploy changes `products` to `items` in the JSON response).
 */
new ApiCheck('product-catalog-api', {
  name: '📦 Product Catalog API',
  activated: true,
  frequency: 2, // every 2 minutes
  locations: ['us-east-1', 'us-west-1', 'eu-west-2'],
  tags: ['astronomy-shop', 'api', 'catalog'],
  alertChannels: channels(slackOpsChannel, emailOncallChannel),

  request: {
    url: '{{ENVIRONMENT_URL}}/api/products',
    method: 'GET',
    headers: [{ key: 'Accept', value: 'application/json' }],

    assertions: [
      // Must return 200
      AssertionBuilder.statusCode().equals(200),

      // Must be fast enough to serve real users
      AssertionBuilder.responseTime().lessThan(2000),

      // Must return JSON
      AssertionBuilder.headers('content-type').contains('application/json'),

      // The catalog must return products. An empty array with a 200 status
      // is still a production incident — this assertion catches it.
      AssertionBuilder.jsonBody('$.length').greaterThan(0),
    ],
  },
})
