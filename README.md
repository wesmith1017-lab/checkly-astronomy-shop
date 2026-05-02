# Checkly Synthetic Monitoring — OTel Demo Astronomy Shop

End-to-end synthetic monitoring suite built with the [Checkly CLI](https://www.checklyhq.com/docs/cli/) against the [OpenTelemetry Demo Astronomy Shop](https://opentelemetry.io/docs/demo/). Demonstrates how synthetic monitoring catches user-facing failures that infrastructure metrics miss.

## The Problem This Solves

Infrastructure dashboards report green while real users experience a blank storefront, a broken cart, or a checkout that silently fails. Synthetic checks simulate the user journey continuously from the outside in the same way a real customer would and alert before revenue is impacted.

---

## Project Structure

```
checkly-astronomy-shop/
├── checkly.config.ts                   # Global Checkly config (locations, timeouts)
├── __checks__/
│   ├── alert-channels.ts               # Slack, Email, PagerDuty routing (conditional on env vars)
│   ├── api/
│   │   ├── frontend-health.check.ts    # GET / — is the server up?
│   │   ├── product-catalog.check.ts    # GET /api/products — is the catalog returning products?
│   │   └── cart-service.check.ts       # POST /api/cart — can users add to cart?
│   └── browser/
│       ├── storefront-smoke.check.ts   # Browser check config for storefront smoke test
│       ├── storefront-smoke.spec.ts    # Playwright: homepage renders real products
│       ├── product-discovery.check.ts  # Browser check config for product discovery
│       ├── product-discovery.spec.ts   # Playwright: homepage → product detail page
│       ├── checkout-flow.check.ts      # Browser check config for checkout flow
│       └── checkout-flow.spec.ts       # Playwright: full purchase to order confirmation
└── .github/workflows/checkly.yml       # CI/CD: test on PR, deploy on merge to main
```

---

## Checks

### API Checks (every 2 minutes, 3 regions)

| Check | Endpoint | What It Catches |
|-------|----------|-----------------|
| Frontend Health | `GET /` | Server down, response > 2s |
| Product Catalog API | `GET /api/products` | Empty catalog with 200 status, schema regressions, response > 2s |
| Cart Service API | `POST /api/cart` | Cart failures, session storage errors, response > 5s |

The Product Catalog check explicitly asserts `$.length > 0` — a 200 response with an empty array is still a production incident.

### Browser Checks (Playwright + Chromium)

| Check | Flow | What It Catches |
|-------|------|-----------------|
| Storefront Smoke | Homepage renders | React hydration errors, empty product grid despite 200 from API, JS console errors |
| Product Discovery | Homepage → product link → product detail | Broken client-side routing, missing price, disabled Add to Cart |
| Full Checkout Flow | Homepage → add to cart → place order → confirmation | Any failure in the full 7-service revenue path |

---

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Checkly account](https://app.checklyhq.com/) (free Hobby plan works)
- The [OTel Demo Astronomy Shop](https://github.com/open-telemetry/opentelemetry-demo) running locally
- A publicly accessible URL pointing to port 8080 (Cloudflare Tunnel recommended — see below)

### Running the OTel Demo Locally

```bash
git clone https://github.com/open-telemetry/opentelemetry-demo.git
cd opentelemetry-demo
docker compose up --force-recreate --remove-orphans
```

The shop is available at `http://localhost:8080` once all containers start (allow 2-3 minutes).

### Exposing Localhost with Cloudflare Tunnel

Checkly runs checks from its cloud infrastructure, so it needs a public URL. Cloudflare Tunnel is the most reliable option for local development:

```bash
# Install cloudflared (Windows)
winget install Cloudflare.cloudflared

# Start a tunnel to port 8080
cloudflared tunnel --url http://localhost:8080
```

Copy the generated `*.trycloudflare.com` URL. You'll need it as `ENVIRONMENT_URL`.

> **Note:** Cloudflare Tunnel generates a new URL each time it starts. Update `ENVIRONMENT_URL` in the Checkly dashboard whenever you restart the tunnel.

---

## Setup

```bash
# Install dependencies
npm install

# Authenticate with Checkly
npx checkly login
```

Set the following environment variables (or add them to a `.env` file — it's gitignored):

```bash
CHECKLY_API_KEY=        # From Checkly dashboard → Settings → API Keys
CHECKLY_ACCOUNT_ID=     # From Checkly dashboard → Settings → General

# Optional alert routing — checks deploy without these, alerts just won't fire
SLACK_WEBHOOK_URL=
PAGERDUTY_SERVICE_KEY=
```

Set `ENVIRONMENT_URL` in the Checkly dashboard under **Environment Variables**:

```
ENVIRONMENT_URL = https://your-tunnel-url.trycloudflare.com
```

---

## Usage

```bash
# Run all checks against ENVIRONMENT_URL (dry run, no deploy)
npx checkly test

# Deploy checks to Checkly
npx checkly deploy --force
```

---

## CI/CD

The GitHub Actions workflow (`.github/workflows/checkly.yml`) does two things:

- **On pull request:** runs `checkly test` against the target environment and reports pass/fail to the PR
- **On merge to main:** runs `checkly test`, then `checkly deploy --force` to sync any check changes to the platform

Required GitHub secrets:

```
CHECKLY_API_KEY
CHECKLY_ACCOUNT_ID
```

Optional GitHub variable:

```
ENVIRONMENT_URL    # defaults to http://localhost:8080 if not set
```

---

## OTel Demo Quirks

A few things that differ from a typical production app:

- **No checkout form.** The demo's "Place Order" button submits immediately with pre-configured demo payment details. There is no shipping/payment form to fill.
- **Constant background traffic.** The OTel Demo runs a load generator and sends OTLP traces to a local collector. `waitUntil: 'networkidle'` never resolves — all browser checks use `domcontentloaded` instead.
- **Expected console errors.** The trace exporter attempts to reach `localhost:4317/4318` from inside Checkly's cloud environment and fails with `ERR_CONNECTION_REFUSED`. These are filtered out of the storefront smoke test's console error assertions.
- **Cloudflare Tunnel noise.** The demo's flagd service uses persistent gRPC streams that generate repeated tunnel error messages. These are harmless.
- **Page title.** The app's `<title>` is `"Otel Demo - Home"` not "Astronomy Shop" — assertions match `/otel demo/i`.
