import { defineConfig } from 'checkly'

/**
 * Global Checkly project configuration.
 *
 * Individual checks override these defaults where needed
 * (e.g., the checkout browser check runs less frequently due to its weight).
 *
 * ENVIRONMENT_URL is set per-environment in Checkly's dashboard:
 *   - Local dev: http://localhost:8080
 *   - Staging/prod: your deployed OTel Demo URL
 *
 * See: https://www.checklyhq.com/docs/cli/project-structure/
 */
export default defineConfig({
  projectName: 'Astronomy Shop — Synthetic Monitoring',
  logicalId: 'astronomy-shop-monitoring',
  repoUrl: 'https://github.com/wesmith1017-lab/checkly-astronomy-shop',

  checks: {
    activated: true,
    muted: false,

    // Use Checkly's 2024.02 runtime (Node 18, Playwright 1.44)
    runtimeId: '2024.02',

    // Default: every 5 minutes. Checkout check overrides this to 10.
    frequency: 5,

    // Three regions to catch geo-specific failures and get meaningful p95 latency data.
    // US-East covers primary traffic, US-West catches CDN/edge issues, EU catches
    // latency regressions that only show up cross-Atlantic.
    locations: ['us-east-1', 'us-west-1', 'eu-west-2'],

    tags: ['astronomy-shop', 'e-commerce'],

    // Alert channels are defined in __checks__/alert-channels.ts and
    // referenced per-check so we can route checkout failures to PagerDuty
    // and everything else to Slack.
    alertChannels: [],

    browserChecks: {
      // Intentionally empty — browser checks are NOT auto-discovered from
      // spec files here. Each .check.ts file creates its own BrowserCheck
      // construct with an explicit entrypoint, which gives us per-check
      // control over frequency, regions, alert routing, and group membership.
      // Auto-discovery via testMatch would bypass all of that.
      testMatch: [],
    },
  },
})
