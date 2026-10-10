# Glance

Describe a dashboard, explore the data, and save the view. A hackathon MVP with 15 curated views covering revenue, customers, invoices, funnels, tasks, teams, service health, and reviews.

## Run locally

Requires Node 22.13+ and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. The complete demo works without credentials. To enable Jev selection, set `AI_ENABLED=true` and a server-only `OPENROUTER_API_KEY` in `.env.local`, then restart. Set a credit limit on that provider key before exposing the app publicly. Never put the key in a `NEXT_PUBLIC_` variable.

For production:

```sh
npm run check
npm run build
npm start
```

## Demo walkthrough

1. Open **Revenue & customers** and click **Generate dashboard**. With AI enabled the view is selected by Jev; otherwise a clearly labeled local selection is used.
2. Click **Accounts at risk**. Inspect the at-risk table and average deal size.
3. Open **Filters**. Select a customer region/status or a revenue period. Export CSV; it contains the currently visible, filtered widget data.
4. Open **Bring your own data**, download the example, change a value and apply the JSON. It replaces the data locally; no raw records are sent to the model.
5. Change the layout, add/reorder/remove views, and **Save view**. Reload and reopen the saved dashboard from the sidebar.
6. Show **Billing & conversion**: invoice INV-2048 totals $3,396 and the funnel includes Retained.

Use Ctrl/Command + Enter to generate from the prompt. Generation is explicit to avoid paid requests on every keystroke. AI failures/timeouts leave a usable local dashboard.

## Data format

Download `/example-data.json` for a valid revenue/customer/invoice example. JSON imports are limited to 500 KB and 1,000 entries per list. Supported top-level sections: `revenue`, `customers`, `invoice`, `tasks`, `team`, `activity`, `reviews`, `regions`, `sla`, `funnel`.

```json
{
  "revenue": {
    "labels": ["2026-06", "2026-07"],
    "values": [71000, 76000],
    "costs": [35000, 36000],
    "goal": 100000
  },
  "customers": {
    "rows": [
      { "id": "8", "name": "Soylent", "region": "NA", "amount": 9100, "status": "Active" }
    ]
  }
}
```

Amounts are USD, not cents. Revenue periods must be unique YYYY-MM strings, with equal-length value/cost arrays. Customer IDs must be unique; statuses are Active, Pending, or At risk. Region shares cannot sum above 100%. Omitted datasets remain empty; imports never silently mix with demo records. Saved dashboards include their data in localStorage; they are private to this browser profile, not synchronized accounts. Use **Download source JSON** for a portable backup. Up to 10 dashboards can be saved.

Demo data lives in `lib/dashboard/demo.json`. It includes the additional July revenue, Soylent account, invoice seats, task, teammate, activity, review, Billing service, and Retained stage supplied for the demo. The LATAM share was explicitly balanced with the other demo shares to total 100%. The original local SQLite database is untouched and no longer required by active routes.

## Architecture

- `components/data-provider.tsx`: data, filters, selection lifecycle, local persistence, cancellation.
- `lib/dashboard/data.ts`: validated imports, available datasets, filtering and demo snapshot.
- `lib/dashboard/planner.ts`: 15-widget allowlist, deterministic selection and plan validation.
- `app/api/dashboard/route.ts`: bounded request input, fixed model questions, timeout, cache, rate limits and fallback.
- `lib/dashboard/budget.ts`: persistent daily request reservation for a single process.
- `lib/widgets/model.ts`: metric calculations. `components/widgets/WidgetView.tsx`: shared renderers.
- `lib/dashboard/export.ts`: filtered CSV export with formula escaping.
- `app/api/health/route.ts`: deployment health check.

The original 135 definitions and unused legacy tile renderer remain for future expansion; only the curated 15 can be selected by the MVP. Historical definitions outside this allowlist are not part of the verified demo. `CODEBASE_MAP.md` describes the pre-MVP audit and is historical.

## Verification

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit/API tests cover metrics, JSON validation, source filtering, selection bounds, CSV escaping, persisted request limits, and model failures. Browser tests cover generation, filtering, export, save/reload, import validation, manual controls, offline fallback, accessibility and three screen widths. API tests mock OpenRouter; they do not spend real credits.

## AI limits and scope

AI is opt-in. Requests contain only prompt and source; prompts themselves can contain sensitive information, so avoid pasting raw records there. Uploaded JSON stays in the browser. There is a 7-second upstream timeout, a 10-second client timeout, a five-minute successful-result cache, and a global ceiling of 20 uncached AI requests per minute per process. A durable daily request ceiling defaults to 100. Every attempted paid request reserves one unit, including failures. Invalid or unavailable model answers fall back locally.

The daily request cap is not a dollar guarantee: set a hard credit limit on the OpenRouter key as well. The filesystem counter supports a single Node process with persistent storage; do not horizontally scale this implementation without moving the limiter to shared transactional storage. Storage errors fail closed to free local selection.

This is a hackathon MVP, with no authentication, multi-tenancy, billing, editing of business records, arbitrary natural-language database queries, year-over-year calculations, or synchronized cloud storage. Revenue periods and customer filters are explicit controls. The public endpoint only exposes fictional demo data. See `DEPLOYMENT.md` for DigitalOcean deployment.

## Presentation artifacts

`DEMO_SCRIPT.md` contains the three-minute pitch. `artifacts/demo-walkthrough.mp4` is a short silent fallback walkthrough, and `artifacts/` contains desktop/mobile screenshots. To re-record against a running local server (Chrome and ffmpeg required):

```sh
DEMO_URL=http://127.0.0.1:3000 BROWSER_CHANNEL=chrome node scripts/record-demo.mjs
```

If Chrome is already installed, `BROWSER_CHANNEL=chrome npm run test:e2e` can use it instead of downloading Playwright Chromium.
