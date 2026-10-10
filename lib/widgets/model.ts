import type { WidgetSpec } from "@/lib/widgets/definitions";
import type { WorkspaceSnapshot } from "@/lib/sources/types";

export type ViewRow = Record<string, string | number>;

export type ViewModel = {
  title: string;
  subtitle: string;
  value: number;
  previous: number;
  max: number;
  unit: string;
  rows: ViewRow[];
  labels: string[];
  values: number[];
  series: { name: string; values: number[] }[];
  items: { title: string; detail: string; meta: string }[];
  people: { name: string; role: string; status: string }[];
  columns: { id: string; title: string; cards: string[] }[];
  groups: { name: string; total: number; rows: ViewRow[] }[];
  fields: { label: string; value: string }[];
  alert: { level: "warning" | "default"; message: string };
  invoice: WorkspaceSnapshot["invoice"];
};

function money(n: number) {
  return n.toLocaleString();
}

export function readModel(snap: WorkspaceSnapshot, spec: WidgetSpec): ViewModel {
  const customers = [...snap.customers.rows].sort((a, b) => b.amount - a.amount);
  const top = customers.slice(0, 5);
  const risk = customers.filter((row) => row.status.toLowerCase().includes("risk"));
  const pending = customers.filter((row) => row.status === "Pending");
  const active = customers.filter((row) => row.status === "Active");
  const byRegion = group(customers, (row) => row.region, (row) => row.amount);
  const byStatus = group(customers, (row) => row.status, (row) => row.amount);
  const booked = customers.reduce((sum, row) => sum + row.amount, 0);
  const months = snap.revenue.labels.map((label, index) => ({
    month: label,
    revenue: snap.revenue.values[index] ?? 0,
    costs: snap.revenue.costs[index] ?? 0,
    margin: (snap.revenue.values[index] ?? 0) - (snap.revenue.costs[index] ?? 0),
  }));
  const latest = months.at(-1);
  const prior = months.at(-2);
  const invoiceTotal = snap.invoice.lines.reduce((sum, line) => sum + line.qty * line.price, 0);
  const online = snap.team.members.filter((member) => member.status === "online");
  const away = snap.team.members.filter((member) => member.status !== "online");
  const openCards = snap.tasks.columns.filter((col) => col.id !== "done").flatMap((col) => col.cards);
  const doneCards = snap.tasks.columns.find((col) => col.id === "done")?.cards ?? [];
  const allCards = snap.tasks.columns.flatMap((col) => col.cards);
  const avgRating =
    snap.reviews.reviews.reduce((sum, review) => sum + review.rating, 0) /
    Math.max(1, snap.reviews.reviews.length);
  const visitors = snap.funnel.stages[0]?.value ?? 1;
  const signups = snap.funnel.stages[1]?.value ?? 0;
  const activated = snap.funnel.stages[2]?.value ?? 0;
  const paid = snap.funnel.stages[3]?.value ?? 0;
  const degraded = snap.sla.services.filter((service) => service.status !== "ok");
  const na = byRegion.find((group) => ["NA", "North America"].includes(group.name))?.total ?? 0;
  const eu = byRegion.find((group) => ["EU", "Europe"].includes(group.name))?.total ?? 0;
  const apac = byRegion.find((group) => group.name.startsWith("APAC"))?.total ?? 0;

  const base: ViewModel = {
    title: spec.label,
    subtitle: `${snap.origin === "demo" ? "Demo data" : snap.origin === "import" ? "Imported data" : "Workspace data"} · ${spec.slice.replaceAll("-", " ")}`,
    value: 0,
    previous: 0,
    max: 100,
    unit: "",
    rows: [],
    labels: [],
    values: [],
    series: [],
    items: [],
    people: snap.team.members,
    columns: snap.tasks.columns,
    groups: [],
    fields: [],
    alert: {
      level: snap.sla.level === "warning" ? "warning" : "default",
      message: snap.sla.message,
    },
    invoice: snap.invoice,
  };

  switch (spec.slice) {
    case "revenue":
      return {
        ...base,
        value: latest?.revenue ?? 0,
        previous: prior?.revenue ?? 0,
        max: snap.revenue.goal,
        unit: "$",
        labels: snap.revenue.labels,
        values: snap.revenue.values,
        series: [
          { name: "Revenue", values: snap.revenue.values },
          { name: "Costs", values: snap.revenue.costs },
        ],
        rows: months.map((month) => ({
          month: month.month,
          revenue: month.revenue,
          costs: month.costs,
          margin: month.margin,
        })),
        items: months.map((month) => ({
          title: month.month,
          detail: `$${money(month.revenue)} revenue`,
          meta: `$${money(month.costs)} cost`,
        })),
        fields: [
          { label: "Latest", value: `$${money(latest?.revenue ?? 0)}` },
          { label: "Previous", value: `$${money(prior?.revenue ?? 0)}` },
          { label: "Goal", value: `$${money(snap.revenue.goal)}` },
        ],
      };
    case "costs":
      return {
        ...base,
        value: latest?.costs ?? 0,
        previous: prior?.costs ?? 0,
        max: Math.max(...snap.revenue.costs, 1),
        unit: "$",
        labels: snap.revenue.labels,
        values: snap.revenue.costs,
        rows: months.map((month) => ({ month: month.month, costs: month.costs })),
      };
    case "margin":
      return {
        ...base,
        value: latest?.margin ?? 0,
        previous: prior?.margin ?? 0,
        max: latest?.revenue || 1,
        unit: "$",
        labels: snap.revenue.labels,
        values: months.map((month) => month.margin),
        rows: months.map((month) => ({
          month: month.month,
          margin: month.margin,
          rate: `${Math.round((month.margin / Math.max(1, month.revenue)) * 100)}%`,
        })),
      };
    case "customers":
      return { ...customerModel(base, customers, booked, customers.length), value: spec.id === "customer-count" ? customers.length : spec.id === "average-deal" ? booked / Math.max(1, customers.length) : booked, unit: spec.id === "customer-count" ? "" : "$" };
    case "customers-top":
      return {
        ...customerModel(base, top, spec.id === "largest-account" ? top[0]?.amount ?? 0 : top.reduce((s, r) => s + r.amount, 0), top[0]?.amount ?? 0),
        items: top.map((row, index) => ({
          title: `${index + 1}. ${row.name}`,
          detail: `$${money(row.amount)}`,
          meta: row.region,
        })),
        fields: [
          { label: "Account", value: top[0]?.name ?? "" },
          { label: "Amount", value: `$${money(top[0]?.amount ?? 0)}` },
          { label: "Region", value: top[0]?.region ?? "" },
          { label: "Status", value: top[0]?.status ?? "" },
        ],
      };
    case "customers-risk":
      return {
        ...customerModel(base, risk, risk.reduce((s, r) => s + r.amount, 0), risk.length),
        max: customers.length,
        value: risk.length,
        unit: "",
      };
    case "customers-status":
      return {
        ...base,
        value: spec.id.includes("pending")
          ? pending.length
          : spec.id.includes("active")
            ? active.length
            : active.length,
        max: customers.length,
        labels: byStatus.map((group) => group.name),
        values: byStatus.map((group) => group.rows.length),
        groups: byStatus,
        rows:
          spec.id === "active-table"
            ? active.map(asCustomerRow)
            : byStatus.map((group) => ({
                status: group.name,
                count: group.rows.length,
                amount: group.total,
              })),
        items: (spec.id.includes("pending") ? pending : active).map((row) => ({
          title: row.name,
          detail: `$${money(row.amount)}`,
          meta: row.status,
        })),
      };
    case "customers-region":
      return {
        ...base,
        value: spec.id.startsWith("na-") ? na : spec.id.startsWith("eu-") ? eu : spec.id.startsWith("apac-") ? apac : na,
        unit: "$",
        max: booked || 1,
        labels: byRegion.map((group) => group.name),
        values: byRegion.map((group) => group.total),
        groups: byRegion,
        items: [...byRegion].sort((a,b)=>b.total-a.total).map(g=>({title:g.name,detail:`$${money(g.total)}`,meta:`${g.rows.length} accounts`})),
        rows: byRegion.map((group) => ({
          region: group.name,
          accounts: group.rows.length,
          amount: group.total,
        })),
      };
    case "invoice":
      return {
        ...base,
        value: spec.id === "line-items" ? snap.invoice.lines.length : invoiceTotal,
        unit: spec.id === "line-items" ? "" : "$",
        max: invoiceTotal || 1,
        rows: snap.invoice.lines.map((line) => ({
          item: line.item,
          qty: line.qty,
          price: line.price,
          total: line.qty * line.price,
        })),
        items: snap.invoice.lines.map((line) => ({
          title: line.item,
          detail: `${line.qty} × $${money(line.price)}`,
          meta: snap.invoice.number,
        })),
        fields: [
          { label: "Number", value: snap.invoice.number },
          { label: "Client", value: snap.invoice.client },
          { label: "Due", value: snap.invoice.due },
          { label: "Total", value: `$${money(invoiceTotal)}` },
        ],
      };
    case "tasks":
    case "tasks-open": {
      const cards = spec.slice === "tasks-open" ? openCards : allCards;
      return {
        ...base,
        value: spec.id.includes("done") ? doneCards.length : spec.slice === "tasks-open" ? openCards.length : doneCards.length,
        max: allCards.length || 1,
        previous: allCards.length,
        columns: spec.slice === "tasks-open"
          ? snap.tasks.columns.filter((col) => col.id !== "done")
          : snap.tasks.columns,
        rows: snap.tasks.columns.flatMap((col) =>
          col.cards.map((card) => ({ task: card, column: col.title })),
        ),
        items: cards.map((card) => ({ title: card, detail: "Task", meta: "" })),
        groups: snap.tasks.columns.map((col) => ({
          name: col.title,
          total: col.cards.length,
          rows: col.cards.map((card) => ({ task: card })),
        })),
      };
    }
    case "team":
    case "team-online":
      return {
        ...base,
        value: spec.slice === "team-online" ? online.length : spec.id === "away-people" ? away.length : snap.team.members.length,
        max: snap.team.members.length || 1,
        people: spec.slice === "team-online" ? online : snap.team.members,
        rows: (spec.slice === "team-online" ? online : snap.team.members).map((member) => ({
          name: member.name,
          role: member.role,
          status: member.status,
        })),
        fields: [
          { label: "Name", value: snap.team.members[0]?.name ?? "" },
          { label: "Role", value: snap.team.members[0]?.role ?? "" },
          { label: "Status", value: snap.team.members[0]?.status ?? "" },
        ],
        groups: [
          { name: "Online", total: online.length, rows: online.map((m) => ({ name: m.name })) },
          { name: "Away", total: away.length, rows: away.map((m) => ({ name: m.name })) },
        ],
      };
    case "activity":
      return {
        ...base,
        value: snap.activity.items.length,
        items: snap.activity.items.map((item) => ({
          title: item.who,
          detail: item.action,
          meta: item.when,
        })),
        rows: snap.activity.items.map((item) => ({
          who: item.who,
          action: item.action,
          when: item.when,
        })),
      };
    case "reviews":
      return {
        ...base,
        value: spec.id.includes("count") ? snap.reviews.reviews.length : avgRating,
        max: 5,
        unit: spec.id.includes("count") ? "" : "★",
        labels: snap.reviews.reviews.map((review) => review.author),
        values: snap.reviews.reviews.map((review) => review.rating),
        rows: snap.reviews.reviews.map((review) => ({
          author: review.author,
          rating: review.rating,
          text: review.text,
        })),
        items: snap.reviews.reviews.map((review) => ({
          title: review.author,
          detail: review.text,
          meta: `${review.rating}/5`,
        })),
      };
    case "regions": {
      const leader = [...snap.regions.regions].sort((a, b) => b.value - a.value)[0];
      return {
        ...base,
        value: leader?.value ?? 0,
        unit: "%",
        max: 100,
        labels: snap.regions.regions.map((region) => region.region),
        values: snap.regions.regions.map((region) => region.value),
        rows: snap.regions.regions.map((region) => ({
          region: region.region,
          share: region.value,
        })),
        items: snap.regions.regions.map((region) => ({
          title: region.region,
          detail: `${region.value}%`,
          meta: "",
        })),
        fields: [{ label: "Leader", value: leader?.region ?? "" }],
      };
    }
    case "sla":
      return {
        ...base,
        value: spec.id.includes("incident") ? snap.sla.incidents : snap.sla.uptime,
        previous: snap.sla.target,
        max: spec.id === "uptime-vs-target" ? snap.sla.target : 100,
        unit: spec.id.includes("incident") ? "" : "%",
        fields: [
          { label: "Uptime", value: `${snap.sla.uptime}%` },
          { label: "Target", value: `${snap.sla.target}%` },
          { label: "Incidents", value: String(snap.sla.incidents) },
        ],
        rows: [
          { metric: "Uptime", value: snap.sla.uptime },
          { metric: "Target", value: snap.sla.target },
          { metric: "Incidents", value: snap.sla.incidents },
        ],
        items: snap.sla.services.map((service) => ({ title: service.name, detail: service.status, meta: snap.sla.message })),
      };
    case "funnel":
      return {
        ...base,
        value:
          spec.id.includes("signup")
            ? signups
            : spec.id.includes("visitor")
              ? visitors
              : spec.id.includes("paid-volume")
                ? paid
                : spec.id.includes("activation")
                  ? Math.round((activated / Math.max(1, signups)) * 100)
                  : spec.id === "funnel-progress" ? (activated / Math.max(1, visitors)) * 100 : (paid / Math.max(1, visitors)) * 100,
        max: spec.id.includes("volume") || spec.id.includes("signup") ? visitors : 100,
        unit: spec.id.includes("volume") || spec.id.includes("signup") ? "" : "%",
        labels: snap.funnel.stages.map((stage) => stage.stage),
        values: snap.funnel.stages.map((stage) => stage.value),
        rows: snap.funnel.stages.map((stage) => ({
          stage: stage.stage,
          value: stage.value,
        })),
        items: snap.funnel.stages.map((stage) => ({
          title: stage.stage,
          detail: stage.value.toLocaleString(),
          meta: "",
        })),
      };
    case "services":
      return {
        ...base,
        value: spec.id.includes("healthy")
          ? snap.sla.services.length - degraded.length
          : degraded.length,
        max: snap.sla.services.length || 1,
        labels: snap.sla.services.map((service) => service.name),
        values: snap.sla.services.map((service) => (service.status === "ok" ? 1 : 0.4)),
        rows: snap.sla.services.map((service) => ({
          service: service.name,
          status: service.status,
        })),
        items: snap.sla.services.map((service) => ({
          title: service.name,
          detail: service.status,
          meta: "",
        })),
        alert: {
          level: degraded.length > 0 ? "warning" : "default",
          message:
            degraded.length > 0
              ? `${degraded.map((service) => service.name).join(", ")} degraded`
              : "All services healthy",
        },
      };
    default:
      return base;
  }
}

function asCustomerRow(row: WorkspaceSnapshot["customers"]["rows"][number]): ViewRow {
  return { name: row.name, region: row.region, amount: row.amount, status: row.status };
}

function customerModel(base: ViewModel, rows: WorkspaceSnapshot["customers"]["rows"], value: number, count: number): ViewModel {
  return {
    ...base,
    value,
    max: Math.max(value, 1),
    previous: count,
    unit: "$",
    rows: rows.map(asCustomerRow),
    labels: rows.map((row) => row.name),
    values: rows.map((row) => row.amount),
    items: rows.map((row) => ({
      title: row.name,
      detail: `$${row.amount.toLocaleString()}`,
      meta: `${row.region} · ${row.status}`,
    })),
  };
}

function group(
  rows: WorkspaceSnapshot["customers"]["rows"],
  keyOf: (row: WorkspaceSnapshot["customers"]["rows"][number]) => string,
  valueOf: (row: WorkspaceSnapshot["customers"]["rows"][number]) => number,
) {
  const map = new Map<string, { name: string; total: number; rows: ViewRow[] }>();
  for (const row of rows) {
    const key = keyOf(row);
    const current = map.get(key) ?? { name: key, total: 0, rows: [] };
    current.total += valueOf(row);
    current.rows.push(asCustomerRow(row));
    map.set(key, current);
  }
  return [...map.values()];
}
