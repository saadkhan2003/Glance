# Glance

A question becomes a dashboard.

Winner, Hacktoberfest Hack Day Swabi 2026.

## Overview

Glance turns a short prompt into a small set of vetted views. The app calculates every displayed number. When Jev is enabled, the model only chooses which views to show and which layout to use. If the model is off, unreachable, or over its request budget, a local planner still selects a dashboard, and the status line says which path ran.

The page opens on an empty workspace. Typing, importing, and loading sample data do not call the model. A dashboard is generated only when you click **Generate dashboard** or press Ctrl/Cmd+Enter.

There are no accounts or shared cloud saves. Year-over-year comparison is not calculated. If a prompt asks for it, the app says so and shows the months that are loaded.

## Live demo

[https://glance.msaad-official6.workers.dev/](https://glance.msaad-official6.workers.dev/)

That Workers deployment is the public demo. Health check: `GET /api/health`.

The checked-in Workers config enables Jev. One shared D1 row caps uncached model requests at 5 per minute and 100 per day. The local planner runs when either limit is reached.

## Features

- **Ask, then generate.** Prompts are 3–600 characters. Suggested questions fill the prompt. They do not call Jev until you generate.
- **Sample data.** **Load sample data** fetches [`/example-data.json`](public/example-data.json) into this browser.
- **Bring your own data.** JSON, including a top-level array of records, SQLite (`.sqlite`, `.db`, `.sqlite3`), CSV, and Excel (`.xlsx`, `.xls`). A multi-sheet workbook can import all sheets, one sheet, or a selected set. Files are limited to 500 KB, and each list is limited to 1,000 rows.
- **Structured sections and raw tables.** JSON may include `revenue`, `customers`, `invoice`, `tasks`, `team`, `activity`, `reviews`, `regions`, `sla`, `funnel`, and `tables`. CSV and Excel keep their original columns as dynamic tables. A customer header of `id,name,region,amount,status` and a revenue header of `month,revenue,costs` also feed the matching metric widgets. SQLite maps tables named `monthly_revenue`, `customers`, `invoice_lines`, `tasks`, `team`, `activity`, `reviews`, `regions`, `sla` (with `services`), and `funnel` into those sections, and keeps every user table as a dynamic table too.
- **Local planner.** `localPlan` in `lib/dashboard/planner.ts` scores an allowlist of 28 widgets from keywords in the prompt and from the datasets that are present. It does not call a model. It keeps one widget when the prompt contains `only` or `single`, eight when it contains `dense`, `all metrics`, or `comprehensive`, and six otherwise. A prompt that contains `invoice` and yields at most two widgets uses the wide layout. Other local plans use overview.
- **Optional Jev selection.** With `AI_ENABLED=true` and a server-side `OPENROUTER_API_KEY`, `POST /api/dashboard` asks OpenRouter (model `typesafe/jev-1.13` by default) to score candidate widgets and choose `overview`, `balanced`, or `wide`. Jev receives the prompt and a source label, not uploaded rows, and can return at most six widgets. The upstream timeout is 7 seconds, and the browser stops waiting after 10 seconds. Invalid or low-confidence answers use the local planner. A successful selection is cached in server memory for five minutes, up to 100 entries. The browser shows the local plan immediately, then replaces it when Jev responds. If the request fails, the local plan stays, and the status line says the connection was unavailable.
- **Canvas controls.** Filter revenue by month and customers by region or status. Imported tables can be filtered by column text. Drag a card to reorder it, or use the arrow buttons. Add a view, up to eight, remove one, or switch layout. Copy a card's component snippet. Export the visible, filtered view as CSV, or download the source JSON.
- **Saved dashboards.** Up to 10 dashboards, including their data, filters, and widget order, stay in this browser's local storage. Opening one does not call the model. Unsaved work is lost on refresh and does not follow you to another device.
- **Feedback.** **Give feedback** and **Request a pilot** post only the fields you type, through FormSubmit, to `msaad.official6@gmail.com`. Uploaded files and dashboard data are not attached.

Excel and SQLite files are sent to the server only to be converted, then returned to the browser. Glance does not store those files on the server.

Customer statuses in structured imports are `Active`, `Pending`, or `At risk`. Customer IDs must be unique. Revenue periods are unique `YYYY-MM` values, and the value and cost arrays must be the same length. Region shares cannot total more than 100. Amounts are US dollars. An import replaces the workspace. It does not merge with records already loaded. A section you leave out stays empty.

`lib/dashboard/demo.json` is fixture data for automated tests. The in-app sample is `public/example-data.json`.

Other widget definitions remain in `lib/widgets/definitions.ts`. Only the 28 ids listed in `lib/dashboard/planner.ts` can be selected.

## Tech stack

| Piece | Role |
| --- | --- |
| Next.js 15, React 19, TypeScript | App and API routes |
| Tailwind CSS 4, Radix UI | Layout and controls |
| Recharts | Charts |
| Zod | Import and plan validation |
| OpenRouter, model `typesafe/jev-1.13` | Optional view selection through Jev |
| Local planner (`lib/dashboard/planner.ts`) | Keyword selection when Jev is not used |
| Cloudflare Workers, OpenNext, D1 | Public deployment and the shared AI request budget |
| Docker Compose | Single-server deployment |

Node.js 22.13 or newer is required for local development. The container image uses Node.js 24.

## Setup

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The default `.env.example` sets `AI_ENABLED=false`, so selection uses the local planner and the status line says so.

To let Jev choose the views, set these in `.env.local` and restart:

```dotenv
AI_ENABLED=true
OPENROUTER_API_KEY=your-server-only-key
JEV_MODEL=typesafe/jev-1.13
```

Put a spending cap on that key before the app is public. The key must never use a `NEXT_PUBLIC_` name.

Production build on Node:

```sh
npm run check
npm run build
npm start
```

On a single Node process, uncached model requests are limited to 20 per rolling minute in that process, and to 100 per UTC day by default (`AI_DAILY_REQUEST_LIMIT`). The daily counter is a file. Storage errors and a reached limit both return the local planner. Single-server notes are in [DEPLOYMENT.md](DEPLOYMENT.md).

Workers deploy. `wrangler.jsonc` sets `AI_ENABLED` to `true` and points the budget at D1. Do not put a real key in `.env.local` when building for Cloudflare. OpenNext copies that file into the generated server environment, and the deploy script rejects a local key. Set a provider credit limit as a second ceiling.

```sh
npx wrangler d1 migrations apply glance-ai-budget --remote
npx wrangler secret put OPENROUTER_API_KEY --name glance
npm run deploy:cf
```

Confirm the selected account with `npx wrangler whoami` before deploying. The public URL uses that account's `workers.dev` subdomain.

Checks:

```sh
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

`npm run check` runs lint, the TypeScript check, and unit tests. Tests cover metric totals, JSON validation, filters, selection bounds, CSV formula escaping, request limits, model failure, save and reload, import, keyboard reorder, accessibility, and desktop, tablet, and phone widths. API tests mock the model and do not spend credits. GitHub Actions runs the same check, production build, and end-to-end suite on push and pull request.

## Usage

1. Open the app. The canvas stays empty until data is loaded.
2. Click **Load sample data**, or open **Bring your own data** and apply JSON or upload a file. The example file is [example-data.json](public/example-data.json).
3. Type a question in **Ask**, or use a suggested question: "Show revenue growth and top customers", "Which customers are at risk?", or "Show invoices and monthly revenue".
4. Click **Generate dashboard**. The status line reports local selection or selection by Jev.
5. Use **Live filters**, reorder or add cards, and switch **Overview**, **Balanced grid**, or **Full width**. Then export CSV or download the source JSON.
6. Click **Save view**. Up to 10 dashboards can be saved. Reopen one from **Saved on this device** after a refresh.
7. Use **Give feedback** or **Request a pilot** to describe a current report and whether Glance handled it.

The three-minute pitch is in [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

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

## Project structure

```text
app/                     Page, layout, and API routes
  api/dashboard/         Jev request, cache, budget, and local fallback
  api/health/            Health check
  api/import/spreadsheet Excel conversion
  api/import/sqlite      SQLite conversion
components/              Composer, canvas, feedback, and widget views
  ui/                    Radix-based controls
lib/dashboard/           Planner, import, export, filters, and budget
lib/widgets/             Widget definitions and metric calculations
lib/sources/             Workspace snapshot types
public/                  Sample JSON and icons
tests/                   Unit tests and Playwright
migrations/              D1 budget schema
scripts/                 Production start, Cloudflare secret check, image packaging
```

| File | Role |
| --- | --- |
| `components/Composer.tsx` | Prompt, sample data, import, and saved views |
| `components/LiveDashboard.tsx` | Canvas, filters, export, and drag-to-reorder |
| `components/data-provider.tsx` | Workspace state and browser storage |
| `lib/dashboard/planner.ts` | Allowlist of 28 widgets and `localPlan` |
| `lib/widgets/model.ts` | Metric calculations |
| `lib/dashboard/export.ts` | CSV export with spreadsheet-formula escaping |
| `wrangler.jsonc` | Workers name, D1 binding, and AI variables |
