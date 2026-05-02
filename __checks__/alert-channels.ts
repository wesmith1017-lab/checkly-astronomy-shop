import {
  SlackAlertChannel,
  EmailAlertChannel,
  PagerdutyAlertChannel,
} from 'checkly/constructs'

/**
 * Alert channels are only instantiated when the corresponding env vars are set.
 * This lets the project deploy cleanly without credentials configured,
 * and checks automatically gain alerting once you add the webhook URLs.
 */

export const slackOpsChannel = process.env.SLACK_WEBHOOK_URL
  ? new SlackAlertChannel('slack-ops', {
      name: 'Ops Slack',
      url: process.env.SLACK_WEBHOOK_URL,
      sendFailure: true,
      sendRecovery: true,
      sendDegraded: true,
    })
  : null

export const emailOncallChannel = process.env.ALERT_EMAIL
  ? new EmailAlertChannel('email-oncall', {
      name: 'On-Call Email',
      address: process.env.ALERT_EMAIL,
      sendFailure: true,
      sendRecovery: true,
      sendDegraded: false,
    })
  : null

export const pagerdutyCheckoutChannel = process.env.PAGERDUTY_SERVICE_KEY
  ? new PagerdutyAlertChannel('pagerduty-checkout', {
      name: 'PagerDuty - Checkout Critical',
      account: 'Astronomy Corp',
      serviceName: 'checkout-synthetic',
      serviceKey: process.env.PAGERDUTY_SERVICE_KEY,
      sendFailure: true,
      sendRecovery: true,
      sendDegraded: false,
    })
  : null

// Helper to filter out any channels that weren't configured
export function channels(
  ...ch: (SlackAlertChannel | EmailAlertChannel | PagerdutyAlertChannel | null)[]
) {
  return ch.filter(Boolean) as (SlackAlertChannel | EmailAlertChannel | PagerdutyAlertChannel)[]
}
