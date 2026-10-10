import { getDb } from "@/lib/db/workspace";
import type { SourceId, WorkspaceSnapshot } from "@/lib/sources/types";

export type { SourceId, WorkspaceSnapshot } from "@/lib/sources/types";
export { SOURCE_IDS } from "@/lib/sources/types";

const RULES: { id: string; test: RegExp }[] = [
  { id: "revenue", test: /revenue|sales|mrr|trend|q[1-4]|kpi|metric|growth/i },
  { id: "customers", test: /customer|account|table|record|top \d+/i },
  { id: "invoices", test: /invoice|billing|receipt|payment/i },
  { id: "tasks", test: /kanban|task|sprint|board|checklist/i },
  { id: "team", test: /team|roster|on-call|staff|activity/i },
  { id: "reviews", test: /review|rating|feedback|nps/i },
  { id: "sla", test: /sla|uptime|status|incident|alert/i },
  { id: "regions", test: /region|geo|map|country/i },
  { id: "funnel", test: /funnel|conversion|pipeline/i },
];

export function loadWorkspace(prompt: string, focus: SourceId = "workspace"): WorkspaceSnapshot {
  const database = getDb();
  const months = database
    .prepare("SELECT month, revenue, costs FROM monthly_revenue")
    .all() as { month: string; revenue: number; costs: number }[];
  const customers = database
    .prepare("SELECT id, name, region, amount, status FROM customers ORDER BY amount DESC")
    .all() as WorkspaceSnapshot["customers"]["rows"];
  const lines = database
    .prepare(
      "SELECT number, client, due, item, qty, price FROM invoice_lines ORDER BY number",
    )
    .all() as {
    number: string;
    client: string;
    due: string;
    item: string;
    qty: number;
    price: number;
  }[];
  const tasks = database
    .prepare("SELECT column_id, column_title, title FROM tasks")
    .all() as { column_id: string; column_title: string; title: string }[];
  const team = database
    .prepare("SELECT name, role, status FROM team")
    .all() as WorkspaceSnapshot["team"]["members"];
  const activityRows = database
    .prepare("SELECT who, action, when_label FROM activity")
    .all() as { who: string; action: string; when_label: string }[];
  const activity = activityRows.map((row) => ({
    who: row.who,
    action: row.action,
    when: row.when_label,
  }));
  const reviews = database
    .prepare("SELECT author, rating, text FROM reviews")
    .all() as WorkspaceSnapshot["reviews"]["reviews"];
  const regions = database
    .prepare("SELECT region, value FROM regions")
    .all() as { region: string; value: number }[];
  const sla = database
    .prepare("SELECT uptime, target, incidents, level, message FROM sla WHERE id = 1")
    .get() as {
    uptime: number;
    target: number;
    incidents: number;
    level: string;
    message: string;
  };
  const services = database
    .prepare("SELECT name, status FROM services")
    .all() as { name: string; status: string }[];
  const funnel = database
    .prepare("SELECT stage, value FROM funnel ORDER BY ord")
    .all() as { stage: string; value: number }[];

  const firstInvoice = lines[0];
  const invoiceLines = lines.filter((l) => l.number === firstInvoice?.number);
  const columns = new Map<string, { id: string; title: string; cards: string[] }>();
  for (const task of tasks) {
    const col = columns.get(task.column_id) ?? {
      id: task.column_id,
      title: task.column_title,
      cards: [],
    };
    col.cards.push(task.title);
    columns.set(task.column_id, col);
  }

  const values = months.map((m) => m.revenue);
  const current = values.at(-1) ?? 0;
  const previous = values.at(-2) ?? 0;

  const matched =
    focus === "workspace"
      ? RULES.filter((rule) => rule.test.test(prompt)).map((rule) => rule.id)
      : [focus];

  return {
    origin: "sqlite",
    matched: matched.length > 0 ? matched : ["workspace"],
    focus,
    revenue: {
      labels: months.map((m) => m.month),
      values,
      costs: months.map((m) => m.costs),
      current,
      previous,
      goal: 100000,
    },
    customers: { rows: customers },
    invoice: {
      number: firstInvoice?.number ?? "",
      client: firstInvoice?.client ?? "",
      due: firstInvoice?.due ?? "",
      lines: invoiceLines.map((l) => ({
        item: l.item,
        qty: l.qty,
        price: l.price,
      })),
    },
    tasks: { columns: [...columns.values()] },
    team: { members: team },
    activity: { items: activity },
    reviews: { reviews },
    regions: { regions },
    sla: { ...sla, services },
    funnel: { stages: funnel },
    tables: { items: [] },
  };
}
