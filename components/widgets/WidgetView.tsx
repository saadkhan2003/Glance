"use client";

import { RecordTable } from "@/components/library/data-display";
import {
  AreaSeriesChart,
  BarSeriesChart,
  LineSeriesChart,
  PieSeriesChart,
  StackedBarSeriesChart,
} from "@/components/library/charts";
import { TileShell } from "@/components/library/tile-shell";
import { useWorkspaceData } from "@/components/data-provider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WidgetSpec } from "@/lib/widgets/definitions";
import { availableData } from "@/lib/dashboard/data";
import { datasetFor } from "@/lib/dashboard/planner";
import { readModel, type ViewModel } from "@/lib/widgets/model";

export function WidgetView({
  spec,
  prompt,
}: {
  spec: WidgetSpec;
  prompt: string;
}) {
  const { snapshot } = useWorkspaceData();
  if (!snapshot) {
    return (
      <TileShell title={spec.label} subtitle="Waiting for workspace data">
        <p className="text-sm text-muted-foreground">
          Type a prompt to load SQLite rows into this component.
        </p>
      </TileShell>
    );
  }
  if (!availableData(snapshot).includes(datasetFor(spec.slice))) {
    return <TileShell title={spec.label} subtitle="No matching data"><p className="py-6 text-sm text-muted-foreground">No records match the current filters. Try a different period or customer filter.</p></TileShell>;
  }
  const model = readModel(snapshot, spec);
  const title = spec.label;
  void prompt;
  return (
    <TileShell title={title} subtitle={model.subtitle}>
      <WidgetBody kind={spec.kind} model={model} />
    </TileShell>
  );
}

function WidgetBody({ kind, model }: { kind: WidgetSpec["kind"]; model: ViewModel }) {
  switch (kind) {
    case "stat":
      return (
        <div>
          <p className="text-3xl font-semibold tabular-nums">
            {model.unit === "$" ? `$${model.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : model.unit === "%" || model.unit === "★" ? `${model.value.toFixed(model.unit === "★" ? 1 : model.value % 1 ? 2 : 0)}${model.unit === "%" ? "%" : ""}` : model.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            {model.unit === "★" ? <span className="ml-1 text-lg text-warning">★</span> : null}
          </p>
        </div>
      );
    case "delta": {
      const delta = model.previous
        ? ((model.value - model.previous) / model.previous) * 100
        : 0;
      return (
        <div className="space-y-2">
          <p className="text-3xl font-semibold tabular-nums">
            ${model.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <Badge variant={delta >= 0 ? "success" : "destructive"}>
            {model.previous ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs prior` : "No prior period"}
          </Badge>
          <p className="text-xs text-muted-foreground">
            Previous ${model.previous.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    case "progress": {
      const pct = Math.min(100, Math.round((model.value / Math.max(model.max, 1)) * 100));
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct}%</span>
            <span>
              {model.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} / {Math.round(model.max).toLocaleString()}
            </span>
          </div>
          <Progress value={pct} />
        </div>
      );
    }
    case "gauge": {
      const pct = Math.min(100, Math.round((model.value / Math.max(model.max, 1)) * 100));
      return (
        <div className="flex flex-col items-center gap-2 py-2">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full"
            style={{
              background: `conic-gradient(var(--primary) ${pct * 3.6}deg, var(--muted) 0)`,
            }}
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-lg font-semibold">
              {pct}%
            </span>
          </div>
        </div>
      );
    }
    case "table":
      return <RecordTable rows={model.rows} />;
    case "line":
      return <LineSeriesChart labels={model.labels} values={model.values} />;
    case "bar":
      return <BarSeriesChart labels={model.labels} values={model.values} />;
    case "area":
      return <AreaSeriesChart labels={model.labels} values={model.values} />;
    case "stacked":
      return (
        <StackedBarSeriesChart labels={model.labels} series={model.series} />
      );
    case "pie":
      return <PieSeriesChart labels={model.labels} values={model.values} />;
    case "funnel":
      return <FunnelBars labels={model.labels} values={model.values} />;
    case "list":
    case "ranked":
      return (
        <ul className="space-y-2">
          {model.items.map((item) => (
            <li
              key={item.title + item.detail}
              className="flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium">{item.title}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {item.detail}
                </span>
              </span>
              {item.meta ? <Badge variant="secondary">{item.meta}</Badge> : null}
            </li>
          ))}
        </ul>
      );
    case "people":
      return (
        <ul className="space-y-3">
          {model.people.map((person) => (
            <li key={person.name} className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{person.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{person.name}</p>
                <p className="text-xs text-muted-foreground">{person.role}</p>
              </div>
              <Badge variant={person.status === "online" ? "success" : "secondary"}>
                {person.status}
              </Badge>
            </li>
          ))}
        </ul>
      );
    case "kanban":
      return (
        <div className="grid gap-2 md:grid-cols-3">
          {model.columns.map((column) => (
            <div key={column.id} className="rounded-md bg-muted/40 p-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                {column.title}
              </p>
              {column.cards.map((card) => (
                <div key={card} className="mb-2 rounded-md border bg-card px-2 py-1.5 text-sm">
                  {card}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    case "timeline":
      return (
        <ol className="space-y-3 border-l pl-4">
          {model.items.map((item) => (
            <li key={item.title + item.detail}>
              <p className="text-xs text-muted-foreground">{item.meta || item.title}</p>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </li>
          ))}
        </ol>
      );
    case "checklist":
      return (
        <ul className="space-y-2">
          {model.columns.flatMap((column) =>
            column.cards.map((card) => (
              <li key={column.id + card} className="flex items-center gap-2 text-sm">
                <Checkbox checked={column.id === "done"} disabled aria-label={card} />
                <span>{card}</span>
                <Badge variant="outline">{column.title}</Badge>
              </li>
            )),
          )}
        </ul>
      );
    case "alert":
      return (
        <Alert variant={model.alert.level === "warning" ? "warning" : "default"}>
          <AlertTitle>{model.alert.level === "warning" ? "Attention" : "Healthy"}</AlertTitle>
          <AlertDescription>{model.alert.message}</AlertDescription>
        </Alert>
      );
    case "services":
      return (
        <ul className="space-y-2 text-sm">
          {model.items.map((item) => (
            <li key={item.title} className="flex items-center justify-between">
              <span>{item.title}</span>
              <Badge variant={item.detail === "ok" ? "success" : "warning"}>
                {item.detail}
              </Badge>
            </li>
          ))}
        </ul>
      );
    case "accordion":
      return (
        <Accordion type="single" collapsible>
          {(model.groups.length > 0 ? model.groups.map((g) => g.name) : model.items.map((i) => i.title))
            .slice(0, 6)
            .map((name, index) => (
              <AccordionItem key={name} value={name}>
                <AccordionTrigger>{name}</AccordionTrigger>
                <AccordionContent>
                  {model.groups[index]
                    ? `${model.groups[index].total.toLocaleString()} · ${model.groups[index].rows.length} rows`
                    : model.items[index]?.detail}
                </AccordionContent>
              </AccordionItem>
            ))}
        </Accordion>
      );
    case "tabs":
      return (
        <Tabs defaultValue={model.groups[0]?.name}>
          <TabsList>
            {model.groups.map((group) => (
              <TabsTrigger key={group.name} value={group.name}>
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>
          {model.groups.map((group) => (
            <TabsContent key={group.name} value={group.name}>
              <RecordTable rows={group.rows.slice(0, 6)} />
            </TabsContent>
          ))}
        </Tabs>
      );
    case "badges":
      return (
        <div className="flex flex-wrap gap-2">
          {(model.groups.length > 0
            ? model.groups.map((group) => `${group.name} ${group.total}`)
            : model.items.map((item) => `${item.title} ${item.detail}`)
          ).map((label) => (
            <Badge key={label} variant="secondary">
              {label}
            </Badge>
          ))}
        </div>
      );
    case "quotes":
      return (
        <ul className="space-y-3">
          {model.items.map((item) => (
            <li key={item.title} className="rounded-md border bg-muted/30 p-3 text-sm">
              <p className="text-warning">{item.meta}</p>
              <p className="mt-1">“{item.detail}”</p>
              <p className="mt-2 text-xs text-muted-foreground">{item.title}</p>
            </li>
          ))}
        </ul>
      );
    case "calendar":
      return (
        <ul className="space-y-2 text-sm">
          {model.fields
            .filter((field) => field.label === "Due" || field.label === "Number")
            .map((field) => (
              <li key={field.label} className="flex justify-between rounded-md border px-3 py-2">
                <span className="text-muted-foreground">{field.label}</span>
                <span className="font-medium">{field.value}</span>
              </li>
            ))}
        </ul>
      );
    case "comparison":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          {(model.groups.length > 0 ? model.groups : model.items.map((item, i) => ({
            name: item.title,
            total: model.values[i] ?? 0,
            rows: [],
          }))).map((group) => (
            <div key={group.name} className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">{group.name}</p>
              <p className="text-xl font-semibold tabular-nums">
                {group.total.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      );
    case "invoice":
      return (
        <div className="space-y-3 text-sm">
          <p className="text-xs text-muted-foreground">
            {model.invoice.number} · {model.invoice.client} · Due {model.invoice.due}
          </p>
          <ul className="space-y-1">
            {model.invoice.lines.map((line) => (
              <li key={line.item} className="flex justify-between">
                <span>
                  {line.item} × {line.qty}
                </span>
                <span>${(line.qty * line.price).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <Separator />
          <p className="text-right font-semibold">
            $
            {model.invoice.lines
              .reduce((sum, line) => sum + line.qty * line.price, 0)
              .toLocaleString()}
          </p>
        </div>
      );
    case "form":
      return (
        <dl className="space-y-2 text-sm">
          {model.fields.map((field) => (
            <div key={field.label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{field.label}</dt>
              <dd className="font-medium">{field.value}</dd>
            </div>
          ))}
        </dl>
      );
    default:
      return <p className="text-sm text-muted-foreground">{kind}</p>;
  }
}

function FunnelBars({ labels, values }: { labels: string[]; values: number[] }) {
  const max = values[0] || 1;
  return (
    <div className="space-y-2">
      {labels.map((label, index) => (
        <div key={label}>
          <div className="mb-1 flex justify-between text-xs">
            <span>{label}</span>
            <span className="text-muted-foreground">{(values[index] ?? 0).toLocaleString()}</span>
          </div>
          <div
            className="h-6 rounded-md bg-primary/80"
            style={{ width: `${((values[index] ?? 0) / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
