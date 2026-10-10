# Glance

A question becomes a dashboard.

Glance turns a short prompt into a small set of vetted views. Numbers are calculated in the app. Jev, when enabled, only chooses which views to show. If the model is unavailable, a local selection still renders.

**Live demo:** [https://strategy-que-phi-wood.trycloudflare.com](https://strategy-que-phi-wood.trycloudflare.com)

The demo is served from this project through a Cloudflare quick tunnel. It stays up while this machine and the tunnel process are running. It is a temporary address, not a custom domain, and it can change if the tunnel is restarted.

## What you can do

The page opens empty. Nothing is loaded until you ask or import.

- Type a question in **Ask**. After a short pause the canvas updates on its own.
- Open a **Sample** for revenue, accounts at risk, billing, or team operations. Sample numbers are fictional and appear only after you choose them.
- Import your own JSON, or upload a file, from **Bring your own data**.
- Filter revenue by month and customers by region or status.
- Drag a card to reorder it. Arrow controls remain for keyboard use.
- Export the visible, filtered view as CSV, or download the source JSON.
- Save up to 10 dashboards in this browser and reopen them after a refresh.

Saved dashboards, filters, and imported records stay in this browser. They are not stored on the server and do not follow you to another device.

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

Accepted sections: `revenue`, `customers`, `invoice`, `tasks`, `team`, `activity`, `reviews`, `regions`, `sla`, `funnel`.

Customer statuses are `Active`, `Pending`, or `At risk`. Customer IDs must be unique. Region shares cannot total more than 100. A section you leave out stays empty. An import does not merge with the sample records.

The bundled sample lives in `lib/dashboard/demo.json`. On that sample, booked customer revenue is $101,000, the average deal is $12,625, and invoice INV-2048 totals $3,396.

## How it is built

| Piece | Role |
| --- | --- |
| `components/Composer.tsx` | Sidebar: prompt, samples, import, saved views |
| `components/LiveDashboard.tsx` | Canvas, filters, export, drag-to-reorder |
| `components/data-provider.tsx` | Data, selection, and browser storage |
| `lib/dashboard/data.ts` | Import validation and filters |
| `lib/dashboard/planner.ts` | Allowlist of 15 widgets and the local plan |
| `lib/widgets/model.ts` | Metric calculations |
| `app/api/dashboard/route.ts` | Bounded Jev request, timeout, cache, and fallback |
| `lib/dashboard/export.ts` | CSV export with spreadsheet-formula escaping |

Only those 15 widgets can be selected. Older widget definitions remain in the repo and are not part of this demo.

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

Deployment notes for a single server are in [DEPLOYMENT.md](DEPLOYMENT.md). The three-minute pitch is in [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
