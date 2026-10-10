import type { TileBindResult } from "./types";
import {
  SAMPLE_ACTIVITY,
  SAMPLE_CALENDAR,
  SAMPLE_CHECKLIST,
  SAMPLE_FUNNEL,
  SAMPLE_HEATMAP,
  SAMPLE_INVOICE,
  SAMPLE_KANBAN,
  SAMPLE_MEDIA,
  SAMPLE_KPI_GOAL,
  SAMPLE_MULTI_SERIES,
  SAMPLE_PRICING,
  SAMPLE_PROFILE,
  SAMPLE_REGIONS,
  SAMPLE_REVIEWS,
  SAMPLE_SERIES,
  SAMPLE_TABLE_ROWS,
  SAMPLE_TEAM,
  SAMPLE_TIMELINE,
} from "./samples";

// Re-export goal sample from samples - add to samples if missing
import { z } from "zod";

const seriesSchema = z.object({
  labels: z.array(z.string()),
  values: z.array(z.number()).optional(),
  series: z
    .array(z.object({ name: z.string(), values: z.array(z.number()) }))
    .optional(),
});

const rowsSchema = z.object({
  rows: z.array(z.record(z.union([z.string(), z.number()]))),
});

function titleFromPrompt(prompt: string, fallback: string): string {
  const t = prompt.trim();
  if (t.length > 0) return t.length > 80 ? `${t.slice(0, 77)}…` : t;
  return fallback;
}

function baseBind(
  prompt: string,
  data: unknown,
  fallbackTitle: string,
  samplePayload: Record<string, unknown>,
  schema?: z.ZodType,
): TileBindResult {
  if (data && schema) {
    const parsed = schema.safeParse(data);
    if (parsed.success) {
      return {
        title: titleFromPrompt(prompt, fallbackTitle),
        isSample: false,
        payload: parsed.data as Record<string, unknown>,
      };
    }
  }
  if (data && typeof data === "object" && !Array.isArray(data)) {
    return {
      title: titleFromPrompt(prompt, fallbackTitle),
      isSample: false,
      payload: data as Record<string, unknown>,
    };
  }
  return {
    title: titleFromPrompt(prompt, fallbackTitle),
    subtitle: "Sample data — paste JSON to replace",
    isSample: true,
    payload: samplePayload,
  };
}

export const binders = {
  kpiSingle: (prompt: string, data: unknown): TileBindResult => {
    const schema = z.object({
      value: z.number(),
      label: z.string().optional(),
      delta: z.number().optional(),
    });
    const b = baseBind(prompt, data, "Key metric", { value: 128400, delta: 12.4 }, schema);
    return b;
  },
  kpiSparklineRow: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "KPI overview", {
      items: [
        { label: "MRR", value: 84.2, unit: "k", spark: [72, 75, 78, 80, 84] },
        { label: "Users", value: 12.4, unit: "k", spark: [10, 10.5, 11, 11.8, 12.4] },
        { label: "Churn", value: 2.1, unit: "%", spark: [2.8, 2.5, 2.3, 2.2, 2.1] },
      ],
    }),
  kpiDelta: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Period comparison", {
      current: 94200,
      previous: 88100,
      label: "Revenue",
    }),
  goalProgress: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Goal progress", SAMPLE_KPI_GOAL),
  gauge: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Capacity", { value: 72, max: 100, label: "Utilization" }),
  chartLine: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Trend", SAMPLE_SERIES, seriesSchema),
  chartBar: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Comparison", SAMPLE_SERIES, seriesSchema),
  chartStackedBar: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Stacked breakdown", SAMPLE_MULTI_SERIES, seriesSchema),
  chartArea: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Volume over time", SAMPLE_SERIES, seriesSchema),
  chartPie: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Share", {
      labels: ["Product", "Services", "Support"],
      values: [55, 30, 15],
    }),
  chartFunnel: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Conversion funnel", { stages: SAMPLE_FUNNEL }),
  chartHeatmap: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Activity heatmap", SAMPLE_HEATMAP),
  dataTable: (prompt: string, data: unknown): TileBindResult => {
    const schema = rowsSchema;
    if (data && schema.safeParse(data).success) {
      return baseBind(prompt, data, "Records", { rows: SAMPLE_TABLE_ROWS }, schema);
    }
    return baseBind(prompt, data, "Records", { rows: SAMPLE_TABLE_ROWS });
  },
  comparisonTable: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "A vs B", {
      rows: [
        { metric: "Revenue", a: 120, b: 98 },
        { metric: "Margin", a: 32, b: 28 },
        { metric: "NPS", a: 62, b: 58 },
      ],
    }),
  pivotSummary: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Summary by region", {
      groups: [
        { name: "NA", total: 45200 },
        { name: "EU", total: 38100 },
        { name: "APAC", total: 29400 },
      ],
    }),
  invoice: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Invoice", SAMPLE_INVOICE),
  profileCard: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Profile", SAMPLE_PROFILE),
  activityFeed: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Recent activity", { items: SAMPLE_ACTIVITY }),
  kanban: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Board", SAMPLE_KANBAN),
  timeline: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Timeline", { events: SAMPLE_TIMELINE }),
  calendar: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Calendar", { events: SAMPLE_CALENDAR }),
  checklist: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Checklist", { items: SAMPLE_CHECKLIST }),
  alertStatus: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "System status", {
      level: "warning",
      message: "Elevated API latency in eu-west",
      services: [
        { name: "API", status: "degraded" },
        { name: "Workers", status: "ok" },
      ],
    }),
  slaUptime: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "SLA", { uptime: 99.92, target: 99.9, incidents: 1 }),
  teamRoster: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Team", { members: SAMPLE_TEAM }),
  formSummary: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Intake summary", {
      fields: [
        { label: "Company", value: "Acme" },
        { label: "Seats", value: "25" },
        { label: "Plan", value: "Team" },
      ],
    }),
  mapRegions: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Regional split", { regions: SAMPLE_REGIONS }),
  pricingTable: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Pricing", { plans: SAMPLE_PRICING }),
  commentsReviews: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Reviews", { reviews: SAMPLE_REVIEWS }),
  mediaGallery: (prompt: string, data: unknown): TileBindResult =>
    baseBind(prompt, data, "Media", { items: SAMPLE_MEDIA }),
};
