import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import path from "node:path";
import { MAX_IMPORT_BYTES } from "@/lib/dashboard/data";

const MONTHS: Record<string, string> = {
  jan: "2026-01", feb: "2026-02", mar: "2026-03", apr: "2026-04",
  may: "2026-05", jun: "2026-06", jul: "2026-07", aug: "2026-08",
  sep: "2026-09", oct: "2026-10", nov: "2026-11", dec: "2026-12",
};

function period(value: unknown) {
  const text = String(value ?? "").trim();
  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) return text;
  return MONTHS[text.slice(0, 3).toLowerCase()] ?? text;
}

function tablesOf(db: DatabaseSync) {
  return new Set(
    (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[]).map((row) => row.name),
  );
}

function columnsOf(db: DatabaseSync, table: string) {
  return new Set((db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map((column) => column.name));
}

/** Read a Glance SQLite file. Only known tables are selected. */
export function importFromSqlite(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_IMPORT_BYTES) throw new Error("Database must be smaller than 500 KB");
  if (!Buffer.from(bytes.subarray(0, 15)).toString("utf8").startsWith("SQLite format 3")) {
    throw new Error("This file is not a SQLite database. Use a .sqlite or .db file, or JSON.");
  }
  const dir = mkdtempSync(path.join(tmpdir(), "glance-sqlite-"));
  const file = path.join(dir, "upload.sqlite");
  writeFileSync(file, bytes);
  const db = new DatabaseSync(file, { readOnly: true });
  try {
    const tables = tablesOf(db);
    const out: Record<string, unknown> = {};
    if (tables.has("monthly_revenue")) {
      const columns = columnsOf(db, "monthly_revenue");
      const rows = db.prepare("SELECT month, revenue, costs FROM monthly_revenue").all() as { month: string; revenue: number; costs: number }[];
      const goalRow = tables.has("goal") ? db.prepare("SELECT goal FROM goal LIMIT 1").get() as { goal: number } | undefined : undefined;
      const goal = columns.has("goal")
        ? (db.prepare("SELECT goal FROM monthly_revenue WHERE goal IS NOT NULL LIMIT 1").get() as { goal: number } | undefined)?.goal
        : goalRow?.goal;
      if (rows.length) out.revenue = { labels: rows.map((row) => period(row.month)), values: rows.map((row) => row.revenue), costs: rows.map((row) => row.costs), goal: goal ?? 100000 };
    }
    if (tables.has("customers")) {
      const rows = db.prepare("SELECT id, name, region, amount, status FROM customers").all();
      if (rows.length) out.customers = { rows };
    }
    if (tables.has("invoice_lines")) {
      const rows = db.prepare("SELECT number, client, due, item, qty, price FROM invoice_lines ORDER BY rowid").all() as { number: string; client: string; due: string; item: string; qty: number; price: number }[];
      const first = rows[0];
      const lines = first ? rows.filter((row) => row.number === first.number) : [];
      if (first) out.invoice = { number: first.number, client: first.client, due: first.due, lines: lines.map((row) => ({ item: row.item, qty: row.qty, price: row.price })) };
    }
    if (tables.has("tasks")) {
      const rows = db.prepare("SELECT column_id, column_title, title FROM tasks ORDER BY rowid").all() as { column_id: string; column_title: string; title: string }[];
      const columns: { id: string; title: string; cards: string[] }[] = [];
      for (const row of rows) {
        const column = columns.find((item) => item.id === row.column_id) ?? columns[columns.push({ id: row.column_id, title: row.column_title, cards: [] }) - 1];
        column.cards.push(row.title);
      }
      if (columns.length) out.tasks = { columns };
    }
    if (tables.has("team")) {
      const members = db.prepare("SELECT name, role, status FROM team").all();
      if (members.length) out.team = { members };
    }
    if (tables.has("activity")) {
      const items = (db.prepare("SELECT who, action, when_label FROM activity ORDER BY rowid").all() as { who: string; action: string; when_label: string }[]).map((row) => ({ who: row.who, action: row.action, when: row.when_label }));
      if (items.length) out.activity = { items };
    }
    if (tables.has("reviews")) {
      const reviews = db.prepare("SELECT author, rating, text FROM reviews").all();
      if (reviews.length) out.reviews = { reviews };
    }
    if (tables.has("regions")) {
      const regions = db.prepare("SELECT region, value FROM regions").all();
      if (regions.length) out.regions = { regions };
    }
    if (tables.has("sla")) {
      const sla = db.prepare("SELECT uptime, target, incidents, level, message FROM sla LIMIT 1").get() as { uptime: number; target: number; incidents: number; level: string; message: string } | undefined;
      const services = tables.has("services") ? db.prepare("SELECT name, status FROM services").all() : [];
      if (sla) out.sla = { ...sla, services };
    }
    if (tables.has("funnel")) {
      const stages = db.prepare("SELECT stage, value FROM funnel ORDER BY ord, rowid").all();
      if (stages.length) out.funnel = { stages };
    }
    if (!Object.keys(out).length) throw new Error("No Glance tables found. Expected monthly_revenue, customers, invoice_lines, tasks, team, activity, reviews, regions, sla, or funnel.");
    return out;
  } finally {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
}
