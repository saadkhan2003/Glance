import type { WorkspaceSnapshot } from "@/lib/sources/types";

/** Shape each premade tile expects, taken from SQLite (or a focused source). */
export function payloadForTile(
  tileId: string,
  snap: WorkspaceSnapshot,
): Record<string, unknown> | null {
  const revenue = snap.revenue;
  const customerTotal = snap.customers.rows.reduce((sum, row) => sum + row.amount, 0);
  const focus = snap.focus;

  if (focus === "customers" && tileId.startsWith("chart")) {
    const byRegion = new Map<string, number>();
    for (const row of snap.customers.rows) {
      byRegion.set(row.region, (byRegion.get(row.region) ?? 0) + row.amount);
    }
    return {
      labels: [...byRegion.keys()],
      values: [...byRegion.values()],
    };
  }
  if (focus === "reviews" && (tileId === "chart-pie" || tileId.startsWith("chart"))) {
    return {
      labels: snap.reviews.reviews.map((r) => r.author),
      values: snap.reviews.reviews.map((r) => r.rating),
    };
  }

  switch (tileId) {
    case "kpi-single":
      return focus === "customers"
        ? { value: customerTotal, label: "Customer book", delta: 8.2 }
        : { value: revenue.current, label: "Revenue", delta: 12.4 };
    case "kpi-sparkline-row":
      return {
        items: [
          { label: "Revenue", value: revenue.current / 1000, unit: "k", spark: revenue.values },
          {
            label: "Customers",
            value: snap.customers.rows.length,
            unit: "",
            spark: [4, 5, 5, 6, 7, snap.customers.rows.length],
          },
          { label: "Uptime", value: snap.sla.uptime, unit: "%", spark: [99.8, 99.9, 99.91, 99.92] },
        ],
      };
    case "kpi-delta":
      return {
        current: revenue.current,
        previous: revenue.previous,
        label: "Revenue",
      };
    case "goal-progress":
      return {
        current: focus === "customers" ? customerTotal : revenue.current,
        target: revenue.goal,
        label: focus === "customers" ? "Booked revenue" : "ARR goal",
      };
    case "gauge":
      return { value: snap.sla.uptime, max: 100, label: "Uptime" };
    case "chart-line":
    case "chart-bar":
    case "chart-area":
      return { labels: revenue.labels, values: revenue.values };
    case "chart-stacked-bar":
      return {
        labels: revenue.labels,
        series: [
          { name: "Revenue", values: revenue.values },
          { name: "Costs", values: revenue.costs },
        ],
      };
    case "chart-pie":
      return {
        labels: snap.regions.regions.map((r) => r.region),
        values: snap.regions.regions.map((r) => r.value),
      };
    case "chart-funnel":
      return snap.funnel;
    case "chart-heatmap":
      return null;
    case "data-table":
    case "comparison-table":
      return snap.customers;
    case "pivot-summary":
      return {
        groups: Object.values(
          snap.customers.rows.reduce<Record<string, { name: string; total: number }>>(
            (acc, row) => {
              const g = acc[row.region] ?? { name: row.region, total: 0 };
              g.total += row.amount;
              acc[row.region] = g;
              return acc;
            },
            {},
          ),
        ),
      };
    case "invoice":
      return snap.invoice;
    case "profile-card":
      return {
        name: snap.team.members[0]?.name ?? "Unknown",
        title: snap.team.members[0]?.role ?? "",
        email: "ana@example.com",
        location: "Berlin",
      };
    case "activity-feed":
      return snap.activity;
    case "kanban":
      return snap.tasks;
    case "timeline":
      return {
        events: snap.activity.items.map((item) => ({
          time: item.when,
          title: item.who,
          detail: item.action,
        })),
      };
    case "calendar":
      return {
        events: [
          { date: snap.invoice.due, title: `${snap.invoice.number} due` },
          { date: "2026-10-12", title: "Customer workshop" },
        ],
      };
    case "checklist":
      return {
        items: snap.tasks.columns.flatMap((col) =>
          col.cards.map((card) => ({
            label: card,
            done: col.id === "done",
          })),
        ),
      };
    case "alert-status":
      return snap.sla;
    case "sla-uptime":
      return snap.sla;
    case "team-roster":
      return snap.team;
    case "form-summary":
      return {
        fields: [
          { label: "Client", value: snap.invoice.client },
          { label: "Invoice", value: snap.invoice.number },
          { label: "Customers", value: String(snap.customers.rows.length) },
        ],
      };
    case "map-regions":
      return snap.regions;
    case "pricing-table":
      return null;
    case "comments-reviews":
      return snap.reviews;
    case "media-gallery":
      return null;
    default:
      return null;
  }
}
