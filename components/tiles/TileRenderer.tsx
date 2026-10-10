"use client";

import {
  AreaSeriesChart,
  BarSeriesChart,
  LineSeriesChart,
  PieSeriesChart,
  StackedBarSeriesChart,
} from "@/components/library/charts";
import { RecordTable } from "@/components/library/data-display";
import {
  GoalProgress,
  MetricValue,
  RadialGauge,
  SparklineRow,
} from "@/components/library/metrics";
import { TileShell } from "@/components/library/tile-shell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkspaceData } from "@/components/data-provider";
import { getTileById } from "@/lib/catalog";
import { payloadForTile } from "@/lib/sources/payload";
import type { TileProps } from "@/lib/types";

function asArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

export function TileRenderer({
  tileId,
  prompt,
  parsedData,
}: {
  tileId: string;
  prompt: string;
  parsedData: unknown;
}) {
  const { snapshot } = useWorkspaceData();
  const tile = getTileById(tileId);
  if (!tile) {
    return (
      <TileShell title="Unknown tile" subtitle={tileId}>
        <p className="text-sm text-muted-foreground">Not in catalog.</p>
      </TileShell>
    );
  }
  const fromDb =
    parsedData == null && snapshot ? payloadForTile(tileId, snapshot) : null;
  const bound = tile.bind(prompt, parsedData ?? fromDb);
  if (fromDb && snapshot) {
    bound.isSample = false;
    bound.subtitle = `SQLite · ${snapshot.matched.join(", ")}`;
  }
  const props: TileProps = { ...bound, tileId };
  return <TileBody {...props} />;
}

function TileBody({
  tileId,
  title,
  subtitle,
  isSample,
  payload,
}: TileProps) {
  switch (tileId) {
    case "kpi-single": {
      const p = asRecord(payload);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <MetricValue
            value={Number(p.value ?? 0).toLocaleString()}
            delta={p.delta as number | undefined}
          />
        </TileShell>
      );
    }
    case "kpi-sparkline-row": {
      const items = asArray<{
        label: string;
        value: number;
        unit?: string;
        spark: number[];
      }>(payload.items);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <div className="grid gap-4 sm:grid-cols-3">
            {items.map((it) => (
              <div key={it.label} className="rounded-lg bg-background/40 p-3">
                <p className="text-xs text-muted-foreground">{it.label}</p>
                <p className="text-xl font-semibold">
                  {it.value}
                  {it.unit}
                </p>
                <SparklineRow values={it.spark} />
              </div>
            ))}
          </div>
        </TileShell>
      );
    }
    case "kpi-delta": {
      const p = asRecord(payload);
      const cur = Number(p.current ?? 0);
      const prev = Number(p.previous ?? 0);
      const delta = prev ? ((cur - prev) / prev) * 100 : 0;
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <MetricValue
            value={cur.toLocaleString()}
            label={String(p.label ?? "")}
            delta={Math.round(delta * 10) / 10}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Previous: {prev.toLocaleString()}
          </p>
        </TileShell>
      );
    }
    case "goal-progress": {
      const p = asRecord(payload);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <GoalProgress
            value={Number(p.current ?? 0)}
            max={Number(p.target ?? 100)}
            label={String(p.label ?? "Progress")}
          />
        </TileShell>
      );
    }
    case "gauge": {
      const p = asRecord(payload);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <RadialGauge
            value={Number(p.value ?? 0)}
            max={Number(p.max ?? 100)}
            label={String(p.label ?? "")}
          />
        </TileShell>
      );
    }
    case "chart-line": {
      const p = asRecord(payload);
      const labels = asArray<string>(p.labels);
      const values = asArray<number>(p.values);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <LineSeriesChart labels={labels} values={values} />
        </TileShell>
      );
    }
    case "chart-bar": {
      const p = asRecord(payload);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <BarSeriesChart
            labels={asArray<string>(p.labels)}
            values={asArray<number>(p.values)}
          />
        </TileShell>
      );
    }
    case "chart-stacked-bar": {
      const p = asRecord(payload);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <StackedBarSeriesChart
            labels={asArray<string>(p.labels)}
            series={asArray<{ name: string; values: number[] }>(p.series)}
          />
        </TileShell>
      );
    }
    case "chart-area": {
      const p = asRecord(payload);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <AreaSeriesChart
            labels={asArray<string>(p.labels)}
            values={asArray<number>(p.values)}
          />
        </TileShell>
      );
    }
    case "chart-pie": {
      const p = asRecord(payload);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <PieSeriesChart
            labels={asArray<string>(p.labels)}
            values={asArray<number>(p.values)}
          />
        </TileShell>
      );
    }
    case "chart-funnel": {
      const stages = asArray<{ stage: string; value: number }>(
        asRecord(payload).stages,
      );
      const max = stages[0]?.value ?? 1;
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <div className="space-y-2">
            {stages.map((s) => (
              <div key={s.stage}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{s.stage}</span>
                  <span className="text-muted-foreground">{s.value.toLocaleString()}</span>
                </div>
                <div
                  className="h-6 rounded bg-accent/80"
                  style={{ width: `${(s.value / max) * 100}%` }}
                />
              </div>
            ))}
          </div>
        </TileShell>
      );
    }
    case "chart-heatmap": {
      const p = asRecord(payload);
      const rows = asArray<string>(p.rows);
      const cols = asArray<string>(p.cols);
      const values = asArray<number[]>(p.values);
      const flat = values.flat();
      const max = Math.max(...flat, 1);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <div className="overflow-x-auto">
            <table className="text-xs">
              <thead>
                <tr>
                  <th />
                  {cols.map((c) => (
                    <th key={c} className="px-2 py-1 text-muted-foreground">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, ri) => (
                  <tr key={r}>
                    <td className="pr-2 text-muted-foreground">{r}</td>
                    {cols.map((_, ci) => {
                      const v = values[ri]?.[ci] ?? 0;
                      const opacity = 0.2 + (v / max) * 0.8;
                      return (
                        <td key={ci} className="p-1">
                          <div
                            className="flex h-8 w-10 items-center justify-center rounded bg-accent"
                            style={{ opacity }}
                            title={String(v)}
                          >
                            {v}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TileShell>
      );
    }
    case "data-table": {
      const rows = asArray<Record<string, string | number>>(
        asRecord(payload).rows,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample} className="col-span-full">
          <RecordTable rows={rows} />
        </TileShell>
      );
    }
    case "comparison-table": {
      const rows = asArray<Record<string, string | number>>(
        asRecord(payload).rows,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <RecordTable rows={rows} />
        </TileShell>
      );
    }
    case "pivot-summary": {
      const groups = asArray<{ name: string; total: number }>(
        asRecord(payload).groups,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <ul className="space-y-2">
            {groups.map((g) => (
              <li
                key={g.name}
                className="flex justify-between rounded-lg bg-background/40 px-3 py-2 text-sm"
              >
                <span>{g.name}</span>
                <span className="font-medium tabular-nums">
                  {g.total.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </TileShell>
      );
    }
    case "invoice": {
      const p = asRecord(payload);
      const lines = asArray<{ item: string; qty: number; price: number }>(
        p.lines,
      );
      const total = lines.reduce((s, l) => s + l.qty * l.price, 0);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <p className="text-xs text-muted-foreground">
            {String(p.number)} · {String(p.client)} · Due {String(p.due)}
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {lines.map((l) => (
              <li key={l.item} className="flex justify-between">
                <span>{l.item} × {l.qty}</span>
                <span>${(l.qty * l.price).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-border pt-2 text-right font-semibold">
            Total ${total.toLocaleString()}
          </p>
        </TileShell>
      );
    }
    case "profile-card": {
      const p = asRecord(payload);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <div className="flex gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="text-lg">
                {String(p.name ?? "?").charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{String(p.name)}</p>
              <p className="text-sm text-muted-foreground">{String(p.title)}</p>
              <p className="text-xs text-muted-foreground">{String(p.email)}</p>
              <p className="text-xs text-muted-foreground">{String(p.location)}</p>
            </div>
          </div>
        </TileShell>
      );
    }
    case "activity-feed": {
      const items = asArray<{ who: string; action: string; when: string }>(
        asRecord(payload).items,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <ul className="space-y-2 text-sm">
            {items.map((it, i) => (
              <li key={i} className="border-l-2 border-accent pl-3">
                <span className="font-medium">{it.who}</span> {it.action}
                <span className="ml-2 text-xs text-muted-foreground">{it.when}</span>
              </li>
            ))}
          </ul>
        </TileShell>
      );
    }
    case "kanban": {
      const columns = asArray<{
        id: string;
        title: string;
        cards: string[];
      }>(asRecord(payload).columns);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample} className="col-span-full">
          <div className="grid gap-3 md:grid-cols-3">
            {columns.map((col) => (
              <div
                key={col.id}
                className="rounded-lg bg-background/50 p-2"
              >
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  {col.title}
                </p>
                {col.cards.map((c) => (
                  <div
                    key={c}
                    className="mb-2 rounded border border-border bg-panel p-2 text-sm"
                  >
                    {c}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </TileShell>
      );
    }
    case "timeline": {
      const events = asArray<{ time: string; title: string; detail: string }>(
        asRecord(payload).events,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <ol className="space-y-3 border-l border-border pl-4">
            {events.map((e, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-accent" />
                <p className="text-xs text-muted-foreground">{e.time}</p>
                <p className="font-medium">{e.title}</p>
                <p className="text-sm text-muted-foreground">{e.detail}</p>
              </li>
            ))}
          </ol>
        </TileShell>
      );
    }
    case "calendar": {
      const events = asArray<{ date: string; title: string }>(
        asRecord(payload).events,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li
                key={e.date + e.title}
                className="flex gap-3 rounded-lg bg-background/40 px-3 py-2"
              >
                <span className="text-xs font-mono text-accent">{e.date}</span>
                <span>{e.title}</span>
              </li>
            ))}
          </ul>
        </TileShell>
      );
    }
    case "checklist": {
      const items = asArray<{ label: string; done: boolean }>(
        asRecord(payload).items,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.label} className="flex items-center gap-2 text-sm">
                <Checkbox checked={it.done} disabled aria-label={it.label} />
                {it.label}
              </li>
            ))}
          </ul>
        </TileShell>
      );
    }
    case "alert-status": {
      const p = asRecord(payload);
      const services = asArray<{ name: string; status: string }>(p.services);
      const level = String(p.level ?? "ok");
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <p
            className={`mb-3 rounded-lg px-3 py-2 text-sm ${
              level === "warning"
                ? "bg-warning/20 text-warning"
                : "bg-success/20 text-success"
            }`}
          >
            {String(p.message)}
          </p>
          <ul className="space-y-1 text-xs">
            {services.map((s) => (
              <li key={s.name} className="flex justify-between">
                <span>{s.name}</span>
                <span className="text-muted-foreground">{s.status}</span>
              </li>
            ))}
          </ul>
        </TileShell>
      );
    }
    case "sla-uptime": {
      const p = asRecord(payload);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <p className="text-3xl font-bold tabular-nums">
            {Number(p.uptime).toFixed(2)}%
          </p>
          <p className="text-sm text-muted-foreground">
            Target {Number(p.target)}% · {Number(p.incidents)} incident(s)
          </p>
        </TileShell>
      );
    }
    case "team-roster": {
      const members = asArray<{ name: string; role: string; status: string }>(
        asRecord(payload).members,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <ul className="space-y-2">
            {members.map((m) => (
              <li key={m.name} className="flex items-center justify-between text-sm">
                <span>
                  <span className="font-medium">{m.name}</span>
                  <span className="ml-2 text-muted-foreground">{m.role}</span>
                </span>
                <span className="text-xs capitalize text-muted-foreground">{m.status}</span>
              </li>
            ))}
          </ul>
        </TileShell>
      );
    }
    case "form-summary": {
      const fields = asArray<{ label: string; value: string }>(
        asRecord(payload).fields,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <dl className="space-y-2 text-sm">
            {fields.map((f) => (
              <div key={f.label} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{f.label}</dt>
                <dd className="font-medium">{f.value}</dd>
              </div>
            ))}
          </dl>
        </TileShell>
      );
    }
    case "map-regions": {
      const regions = asArray<{ region: string; value: number }>(
        asRecord(payload).regions,
      );
      const max = Math.max(...regions.map((r) => r.value), 1);
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <div className="grid gap-2">
            {regions.map((r) => (
              <div key={r.region}>
                <div className="flex justify-between text-xs">
                  <span>{r.region}</span>
                  <span>{r.value}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-panel-border">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(r.value / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </TileShell>
      );
    }
    case "pricing-table": {
      const plans = asArray<{ plan: string; price: number; features: string[] }>(
        asRecord(payload).plans,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample} className="col-span-full">
          <div className="grid gap-3 md:grid-cols-3">
            {plans.map((pl) => (
              <div
                key={pl.plan}
                className="rounded-lg border border-border p-3"
              >
                <p className="font-semibold">{pl.plan}</p>
                <p className="text-2xl font-bold">${pl.price}</p>
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {pl.features.map((f) => (
                    <li key={f}>· {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </TileShell>
      );
    }
    case "comments-reviews": {
      const reviews = asArray<{ author: string; rating: number; text: string }>(
        asRecord(payload).reviews,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <ul className="space-y-3 text-sm">
            {reviews.map((r) => (
              <li key={r.author} className="rounded-lg bg-background/40 p-3">
                <p className="font-medium">
                  {r.author}{" "}
                  <span className="text-warning">{"★".repeat(r.rating)}</span>
                </p>
                <p className="text-muted-foreground">{r.text}</p>
              </li>
            ))}
          </ul>
        </TileShell>
      );
    }
    case "media-gallery": {
      const items = asArray<{ title: string; type: string }>(
        asRecord(payload).items,
      );
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <div className="grid grid-cols-3 gap-2">
            {items.map((it) => (
              <div
                key={it.title}
                className="flex aspect-video flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background/30 text-xs text-muted-foreground"
              >
                <span className="uppercase">{it.type}</span>
                <span className="mt-1 text-foreground">{it.title}</span>
              </div>
            ))}
          </div>
        </TileShell>
      );
    }
    default:
      return (
        <TileShell title={title} subtitle={subtitle} isSample={isSample}>
          <p className="text-sm text-muted-foreground">Tile not implemented: {tileId}</p>
        </TileShell>
      );
  }
}
