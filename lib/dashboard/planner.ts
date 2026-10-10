import { z } from "zod";
import { WIDGETS } from "@/lib/widgets/definitions";
import { SOURCE_IDS, type SourceId } from "@/lib/sources/types";

const IDS = ["revenue-headline", "revenue-mom", "revenue-line", "booked-revenue", "customer-count", "average-deal", "largest-account", "customer-table", "risk-table", "invoice-card", "funnel-chart", "kanban-board", "team-roster", "service-list", "review-quotes"];
export const CURATED_WIDGETS = IDS.map(id=>WIDGETS.find(w=>w.id===id)!);
export const planSchema = z.object({ layout: z.enum(["overview", "balanced", "wide"]), widgets: z.array(z.string()).min(1).max(8).refine(ids=>new Set(ids).size===ids.length) });
export type DashboardPlan = z.infer<typeof planSchema>;
export type Selection = DashboardPlan & { mode: "local" | "ai"; message: string; ms?: number };
export const requestSchema = z.object({ prompt: z.string().trim().min(3).max(600), source: z.enum(SOURCE_IDS), available: z.array(z.enum(["revenue", "customers", "invoice", "tasks", "team", "activity", "reviews", "regions", "sla", "funnel"])).min(1).max(10) }).strict();
export type PlanRequest = z.infer<typeof requestSchema>;
export function datasetFor(slice: string) { return slice.startsWith("customers") ? "customers" : slice.startsWith("tasks") ? "tasks" : slice.startsWith("team") ? "team" : slice === "services" ? "sla" : slice === "costs" || slice === "margin" ? "revenue" : slice; }
const focusDataset: Record<SourceId, string> = { workspace: "", revenue: "revenue", customers: "customers", invoices: "invoice", tasks: "tasks", team: "team", reviews: "reviews" };
export function candidatesFor(input: PlanRequest) {
  return CURATED_WIDGETS.filter(w=>input.available.includes(datasetFor(w.slice) as PlanRequest["available"][number]) && (!focusDataset[input.source] || datasetFor(w.slice) === focusDataset[input.source]));
}
export function localPlan(input: PlanRequest): Selection {
  const p = input.prompt.toLowerCase();
  const candidates = candidatesFor(input);
  const relevance: Record<string, number> = {
    revenue: /revenue|sales|growth|trend|month|executive|overview/.test(p) ? 5 : 0,
    customers: /customer|account|deal|risk|book|region|executive|overview/.test(p) ? 5 : 0,
    invoice: /invoice|billing|receipt|line item/.test(p) ? 8 : 0,
    funnel: /funnel|conversion|retain|activation/.test(p) ? 8 : 0,
    tasks: /task|kanban|sprint|board/.test(p) ? 8 : 0,
    team: /team|people|roster|online/.test(p) ? 8 : 0,
    sla: /service|health|sla|uptime|incident/.test(p) ? 8 : 0,
    reviews: /review|rating|feedback/.test(p) ? 8 : 0,
  };
  const preferences: Record<string, number> = { "revenue-headline": 2, "revenue-line": 3, "customer-table": 2, "customer-count": 1 };
  if (/risk/.test(p)) preferences["risk-table"] = 15;
  if (/average/.test(p)) preferences["average-deal"] = 15;
  if (/largest|biggest|top/.test(p)) preferences["largest-account"] = 12;
  if (/growth|previous|comparison/.test(p)) preferences["revenue-mom"] = 12;
  if (/booked|total.*customer/.test(p)) preferences["booked-revenue"] = 12;
  if (/count|how many/.test(p)) preferences["customer-count"] = 12;
  const scored = candidates.map(w=>({w, score: (relevance[datasetFor(w.slice)] ?? 0) + (preferences[w.id] ?? 0)})).sort((a,b)=>b.score-a.score);
  const relevant = scored.filter(r=>(relevance[datasetFor(r.w.slice)] ?? 0)>0);
  const list = relevant.length ? relevant : scored;
  const take = /dense|all metrics|comprehensive/.test(p) ? 6 : /only|single/.test(p) ? 1 : 4;
  const widgets = list.slice(0,take).map(r=>r.w.id);
  return { layout: /invoice/.test(p) && widgets.length <= 2 ? "wide" : "overview", widgets, mode: "local", message: "Local selection · no model request needed" };
}
export function validatePlan(raw: unknown, input: PlanRequest): DashboardPlan {
  const plan = planSchema.parse(raw);
  const allowed = new Set(candidatesFor(input).map(w=>w.id));
  if (plan.widgets.some(id=>!allowed.has(id))) throw new Error("Unavailable widget in selection");
  return plan;
}
