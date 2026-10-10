import { z } from "zod";
import demo from "./demo.json";
import type { WorkspaceSnapshot } from "@/lib/sources/types";

export const MAX_IMPORT_BYTES = 500_000;
const text = z.string().trim().min(1).max(200);
const amount = z.number().finite().nonnegative().max(1e12);
const rows = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).max(1000);
const revenueSchema = z.object({
  labels: rows(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM periods")),
  values: rows(amount), costs: rows(amount), goal: amount.positive(),
}).superRefine((v, ctx) => {
  if (v.labels.length !== v.values.length || v.labels.length !== v.costs.length)
    ctx.addIssue({ code: "custom", message: "Revenue labels, values and costs must have equal lengths" });
  if (new Set(v.labels).size !== v.labels.length)
    ctx.addIssue({ code: "custom", message: "Revenue periods must be unique" });
});
export const importSchema = z.object({
  revenue: revenueSchema.optional(),
  customers: z.object({ rows: rows(z.object({ id: text, name: text, region: text,
    amount, status: z.enum(["Active", "Pending", "At risk"]) })).refine(v => new Set(v.map(r => r.id)).size === v.length, "Customer IDs must be unique") }).optional(),
  invoice: z.object({ number: text, client: text, due: z.string().date(),
    lines: rows(z.object({ item: text, qty: z.number().int().nonnegative().max(100000), price: amount })) }).optional(),
  tasks: z.object({ columns: rows(z.object({ id: text, title: text, cards: rows(text) })) }).optional(),
  team: z.object({ members: rows(z.object({ name: text, role: text, status: z.enum(["online", "away"]) })) }).optional(),
  activity: z.object({ items: rows(z.object({ who: text, action: text, when: text })) }).optional(),
  reviews: z.object({ reviews: rows(z.object({ author: text, rating: z.number().min(1).max(5), text: z.string().max(2000) })) }).optional(),
  regions: z.object({ regions: rows(z.object({ region: text, value: amount.max(100) })).refine(v => v.reduce((s,r) => s+r.value,0) <= 100.01, "Region percentages cannot total more than 100") }).optional(),
  sla: z.object({ uptime: amount.max(100), target: amount.max(100), incidents: z.number().int().nonnegative(), level: z.enum(["warning", "default"]), message: text, services: rows(z.object({ name: text, status: z.enum(["ok", "degraded"]) })) }).optional(),
  funnel: z.object({ stages: rows(z.object({ stage: text, value: z.number().int().nonnegative().max(1e12) })) }).optional(),
}).strict().refine(v => Object.keys(v).length > 0, "Include at least one dataset: revenue, customers, invoice, tasks, team, reviews, activity, regions, sla or funnel");

export function demoSnapshot(): WorkspaceSnapshot { return structuredClone(demo) as WorkspaceSnapshot; }
export function emptySnapshot(): WorkspaceSnapshot {
  return {
    origin: "empty", focus: "workspace", matched: [],
    revenue: { labels: [], values: [], costs: [], goal: 100000, current: 0, previous: 0 },
    customers: { rows: [] }, invoice: { number: "", client: "", due: "", lines: [] },
    tasks: { columns: [] }, team: { members: [] }, activity: { items: [] }, reviews: { reviews: [] },
    regions: { regions: [] }, sla: { uptime: 0, target: 0, incidents: 0, level: "default", message: "", services: [] },
    funnel: { stages: [] },
  };
}
export function parseImport(input: string): WorkspaceSnapshot {
  if (new TextEncoder().encode(input).length > MAX_IMPORT_BYTES) throw new Error("JSON must be smaller than 500 KB");
  let raw: unknown;
  try { raw = JSON.parse(input); } catch { throw new Error("Invalid JSON. Check commas, quotes and brackets."); }
  const result = importSchema.safeParse(raw);
  if (!result.success) throw new Error(result.error.issues.slice(0, 3).map(i => `${i.path.join(".") || "Data"}: ${i.message}`).join(" · "));
  const data = result.data;
  const snap: WorkspaceSnapshot = {
    origin: "import", updatedAt: new Date().toISOString(), focus: "workspace", matched: Object.keys(data),
    revenue: { labels: [], values: [], costs: [], goal: 100000, current: 0, previous: 0 },
    customers: { rows: [] }, invoice: { number: "", client: "", due: "", lines: [] },
    tasks: { columns: [] }, team: { members: [] }, activity: { items: [] }, reviews: { reviews: [] },
    regions: { regions: [] }, sla: { uptime: 0, target: 0, incidents: 0, level: "default", message: "No service data", services: [] }, funnel: { stages: [] },
    ...data,
  } as WorkspaceSnapshot;
  const order = snap.revenue.labels.map((label, i) => ({ label, value: snap.revenue.values[i], cost: snap.revenue.costs[i] })).sort((a,b) => a.label.localeCompare(b.label));
  snap.revenue = { ...snap.revenue, labels: order.map(r=>r.label), values: order.map(r=>r.value), costs: order.map(r=>r.cost), current: order.at(-1)?.value ?? 0, previous: order.at(-2)?.value ?? 0 };
  snap.customers.rows.sort((a,b)=>b.amount-a.amount);
  return snap;
}
export function importable(s: WorkspaceSnapshot) {
  const { origin: _origin, updatedAt: _updatedAt, focus: _focus, matched: _matched, ...datasets } = s;
  void _origin; void _updatedAt; void _focus; void _matched;
  // Omit absent datasets so saved partial imports retain their availability.
  return Object.fromEntries(Object.entries(datasets).filter(([key]) => availableData(s).includes(key)));
}
export function availableData(s: WorkspaceSnapshot): string[] {
  return [s.revenue.labels.length && "revenue", s.customers.rows.length && "customers", s.invoice.number && "invoice", s.tasks.columns.length && "tasks", s.team.members.length && "team", s.activity.items.length && "activity", s.reviews.reviews.length && "reviews", s.regions.regions.length && "regions", (s.sla.services.length || s.sla.target) && "sla", s.funnel.stages.length && "funnel"].filter(Boolean) as string[];
}
export const filtersSchema = z.object({ from: z.string().regex(/^(|\d{4}-(0[1-9]|1[0-2]))$/), to: z.string().regex(/^(|\d{4}-(0[1-9]|1[0-2]))$/), region: z.string().max(200), status: z.enum(["all", "Active", "Pending", "At risk"]) });
export type Filters = z.infer<typeof filtersSchema>;
export const EMPTY_FILTERS: Filters = { from: "", to: "", region: "all", status: "all" };
export function filterSnapshot(s: WorkspaceSnapshot, f: Filters): WorkspaceSnapshot {
  const indices = s.revenue.labels.map((label,i)=>({label,i})).filter(r=>(!f.from || r.label >= f.from) && (!f.to || r.label <= f.to));
  const values = indices.map(r=>s.revenue.values[r.i]);
  return { ...s, revenue: { ...s.revenue, labels: indices.map(r=>r.label), values, costs: indices.map(r=>s.revenue.costs[r.i]), current: values.at(-1) ?? 0, previous: values.at(-2) ?? 0 }, customers: { rows: s.customers.rows.filter(r=>(f.region === "all" || r.region === f.region) && (f.status === "all" || r.status === f.status)) } };
}
