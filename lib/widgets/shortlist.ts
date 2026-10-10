import { WIDGETS, type WidgetSpec } from "@/lib/widgets/definitions";
import type { SourceId } from "@/lib/sources/types";

const SOURCE_HINT: Record<SourceId, string[]> = {
  workspace: [],
  revenue: ["revenue", "cost", "margin", "goal"],
  customers: ["customer", "account", "region", "risk", "deal", "book"],
  invoices: ["invoice", "billing", "line"],
  tasks: ["task", "kanban", "sprint", "checklist"],
  team: ["team", "people", "activity", "online", "roster"],
  reviews: ["review", "rating"],
};

/** Local shortlist so Jev grades the relevant slice, not all 100+ widgets at once. */
export function shortlistWidgets(prompt: string, source: SourceId, limit = 18): WidgetSpec[] {
  const tokens = `${prompt} ${SOURCE_HINT[source].join(" ")}`
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

  const ranked = WIDGETS.map((widget) => {
    const hay = `${widget.label} ${widget.when} ${widget.family} ${widget.slice} ${widget.kind}`.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (hay.includes(token)) score += 1;
    }
    return { widget, score };
  }).sort((a, b) => b.score - a.score);

  const hits = ranked.filter((entry) => entry.score > 0).slice(0, limit);
  if (hits.length >= 6) return hits.map((entry) => entry.widget);

  const families = new Set<string>();
  const diverse: WidgetSpec[] = [];
  for (const widget of WIDGETS) {
    if (families.has(widget.family) && diverse.length > 8) continue;
    families.add(widget.family);
    diverse.push(widget);
    if (diverse.length >= limit) break;
  }
  return diverse;
}
