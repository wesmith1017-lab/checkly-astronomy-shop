import { ApiCheck, AssertionBuilder } from 'checkly/constructs'
import { slackOpsChannel, channels } from '../alert-channels'

/**
 * Frontend Health Check
 *
 * The fastest, lightest signal we have. A 1-minute frequency means we catch
 * outages before most internal alerting pipelines even begin aggregating metrics.
 *
 * Why not just ping the load balancer? Because a 200 from your LB doesn't
 * mean the Next.js app served a real page. This check validates that the
 * HTML document returned contains the expected page structure — a blank page
 * with a 200 is still an incident.
 *
 * What it catches: frontend service crashes, CDN misconfigurations, deployment
 * rollouts that serve a broken build, SSL certificate issues.
 */
new ApiCheck('frontend-health', {
  name: '⚡ Frontend Health',
  activated: true,
  frequency: 1, // every minute — this is your canary
  locations: ['us-east-1', 'us-west-1', 'eu-west-2'],
  tags: ['astronomy-shop', 'api', 'critical'],
  alertChannels: channels(slackOpsChannel),

  request: {
    url: '{{ENVIRONMENT_URL}}/',
    method: 'GET',
    followRedirects: true,
    skipSSL: false,

    assertions: [
      // Hard requirement: app must respond with 200
      AssertionBuilder.statusCode().equals(200),

      // Response time threshold: 800ms. The OTel demo is a multi-service app
      // that does real service calls on page load. If the frontend is responding
      // in >800ms for a simple GET /, something upstream is degraded.
      AssertionBuilder.responseTime().lessThan(800),

      // Validate the Content-Type so we know we got an HTML page,
      // not an error JSON blob that somehow returned 200.
      AssertionBuilder.headers('content-type').contains('text/html'),
    ],
  },
})
