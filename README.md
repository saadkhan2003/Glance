# Glance

A question becomes a dashboard.

Glance turns a short prompt into a small set of vetted views. Numbers are calculated in the app. Jev, when enabled, only chooses which views to show. If the model is unavailable, a local selection still renders.

**Live demo:** [https://glance.msaad-official6.workers.dev](https://glance.msaad-official6.workers.dev)

## What you can do

The page opens empty. Import data before asking for a dashboard.

- Type a question in **Ask**. After a short pause the canvas updates on its own.
- Import JSON, SQLite, CSV, or Excel from **Bring your own data**. Excel files with multiple sheets can import all sheets or one selected sheet.
- Filter revenue by month and customers by region or status.
- Drag a card to reorder it. Arrow controls remain for keyboard use.
- Export the visible, filtered view as CSV, or download the source JSON.
- Save up to 10 dashboards in this browser and reopen them after a refresh.

Imported records stay in this browser. Up to 10 saved dashboards are stored in its local storage; unsaved work is lost on refresh. Nothing follows you to another device.

## Run it yourself

Node.js 22.13 or newer, and npm.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The demo works with no API key. Selection falls back to the local planner, and the status line says so.

To let Jev choose the views, set these in `.env.local` and restart:

```dotenv
AI_ENABLED=true
OPENROUTER_API_KEY=your-server-only-key
JEV_MODEL=typesafe/jev-1.13
```

Put a spending cap on that key before the app is public. The key must never use a `NEXT_PUBLIC_` name.

Production build:

```sh
npm run check
npm run build
npm start
```

Health check: `GET /api/health`.

## Data you can import

Download [example-data.json](public/example-data.json), or open `/example-data.json` on a running app. Imports are limited to 500 KB and 1,000 rows per list. Amounts are US dollars. Revenue periods are unique `YYYY-MM` values, and the value and cost arrays must be the same length.

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

Accepted JSON sections: `revenue`, `customers`, `invoice`, `tasks`, `team`, `activity`, `reviews`, `regions`, `sla`, `funnel`, `tables`.

CSV, Excel, and SQLite imports preserve their original columns as dynamic tables. Recognized revenue and customer layouts also power the matching metric widgets.

Customer statuses are `Active`, `Pending`, or `At risk`. Customer IDs must be unique. Region shares cannot total more than 100. A section you leave out stays empty. An import does not merge with other records already in the workspace.

`lib/dashboard/demo.json` is used only by automated tests, not loaded in the UI.

## How it is built

| Piece | Role |
| --- | --- |
| `components/Composer.tsx` | Sidebar: prompt, import, saved views |
| `components/LiveDashboard.tsx` | Canvas, filters, export, drag-to-reorder |
| `components/data-provider.tsx` | Data, selection, and browser storage |
| `lib/dashboard/data.ts` | Import validation and filters |
| `lib/dashboard/planner.ts` | Allowlist of 28 widgets and the local plan |
| `lib/widgets/model.ts` | Metric calculations |
| `app/api/dashboard/route.ts` | Bounded Jev request, timeout, cache, and fallback |
| `lib/dashboard/export.ts` | CSV export with spreadsheet-formula escaping |

Those 28 widgets can be selected. Other definitions remain in the repo but are not yet part of the curated set.

## Verification

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

Tests cover metric totals, JSON validation, filters, selection bounds, CSV escaping, request limits, model failure, save and reload, import, keyboard reorder, accessibility, and desktop, tablet, and phone widths. API tests mock the model and do not spend credits.

## Limits

Glance is a working demo.

- There are no accounts, teams, or shared cloud saves.
- The model receives the prompt and the source name, not uploaded rows. Do not put private records in the prompt.
- AI is off unless `AI_ENABLED=true`. Failures return the local dashboard.
- Paid requests are capped per process: 20 uncached calls a minute, and 100 a day by default. Set a provider credit limit as well. The daily counter is a single-process file, not a shared billing system.
- Year-over-year comparison is not calculated. The app says so when a prompt asks for it.

## Cloudflare Workers

Public Workers deploy uses a Cloudflare secret for `OPENROUTER_API_KEY`. Jev is enabled in `wrangler.jsonc`; a per-location rate-limit binding caps model requests to five per minute, and the local planner remains available when the limit is reached. Set a hard spending cap with the model provider before public use.

```sh
npx wrangler logout
npx wrangler login
npm run deploy:cf
```

Confirm the selected account with `npx wrangler whoami` before deploying. The public URL uses that account's Workers subdomain.

Deployment notes for a single server are in [DEPLOYMENT.md](DEPLOYMENT.md). The three-minute pitch is in [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
