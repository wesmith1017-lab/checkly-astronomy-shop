import { ApiCheck, AssertionBuilder } from 'checkly/constructs'
import { slackOpsChannel, channels } from '../alert-channels'
import { apiGroup } from '../groups'

/**
 * Frontend Health Check
 *
 * The fastest, lightest signal in the suite. A 1-minute frequency means we
 * catch outages before most internal alerting pipelines even begin aggregating
 * metrics — this is the canary.
 *
 * This check validates three things: the server returned 200, the response
 * arrived within the SLA window, and the Content-Type confirms we got an HTML
 * page rather than an error JSON blob that somehow returned 200. It does not
 * validate rendered content — that is the job of the Storefront Smoke browser
 * check, which runs the full React hydration path.
 *
 * What it catches: frontend service crashes, CDN misconfigurations, deployment
 * rollouts that serve a broken build, severe performance regressions.
 */
new ApiCheck('frontend-health', {
  name: '⚡ Frontend Health',
  activated: true,
  frequency: 1, // every minute — this is your canary
  locations: ['us-east-1', 'us-west-1', 'eu-west-2'],
  tags: ['astronomy-shop', 'api', 'critical'],
  group: apiGroup,
  alertChannels: channels(slackOpsChannel),

  request: {
    url: '{{ENVIRONMENT_URL}}/',
    method: 'GET',
    followRedirects: true,
    skipSSL: false,

    assertions: [
      // Hard requirement: app must respond with 200
      AssertionBuilder.statusCode().equals(200),

      // Response time SLA: 2,000ms. A GET / that takes longer than 2 seconds
      // is a degraded user experience even if it technically succeeds. The OTel
      // demo is a multi-service stack, so sustained latency here signals upstream
      // congestion before it becomes a full outage.
      AssertionBuilder.responseTime().lessThan(2000),

      // Validate the Content-Type so we know we got an HTML page,
      // not an error JSON blob that somehow returned 200.
      AssertionBuilder.headers('content-type').contains('text/html'),
    ],
  },
})
