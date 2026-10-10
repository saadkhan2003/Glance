import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";

let db: DatabaseSync | null = null;

function seed(database: DatabaseSync) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS monthly_revenue (
      month TEXT PRIMARY KEY,
      revenue INTEGER NOT NULL,
      costs INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS invoice_lines (
      id INTEGER PRIMARY KEY,
      number TEXT NOT NULL,
      client TEXT NOT NULL,
      due TEXT NOT NULL,
      item TEXT NOT NULL,
      qty INTEGER NOT NULL,
      price INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      column_id TEXT NOT NULL,
      column_title TEXT NOT NULL,
      title TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS team (
      name TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY,
      who TEXT NOT NULL,
      action TEXT NOT NULL,
      when_label TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      author TEXT PRIMARY KEY,
      rating INTEGER NOT NULL,
      text TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS regions (
      region TEXT PRIMARY KEY,
      value INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sla (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      uptime REAL NOT NULL,
      target REAL NOT NULL,
      incidents INTEGER NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS services (
      name TEXT PRIMARY KEY,
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS funnel (
      stage TEXT PRIMARY KEY,
      value INTEGER NOT NULL,
      ord INTEGER NOT NULL
    );
  `);

  const count = database.prepare("SELECT COUNT(*) AS n FROM customers").get() as {
    n: number;
  };
  if (count.n > 0) return;

  const insert = database.prepare.bind(database);
  const months = [
    ["Jan", 42000, 28000],
    ["Feb", 51000, 30000],
    ["Mar", 48000, 31000],
    ["Apr", 62000, 33000],
    ["May", 58000, 32000],
    ["Jun", 71000, 35000],
  ] as const;
  const rev = insert(
    "INSERT INTO monthly_revenue (month, revenue, costs) VALUES (?, ?, ?)",
  );
  for (const row of months) rev.run(...row);

  const cust = insert(
    "INSERT INTO customers (id, name, region, amount, status) VALUES (?, ?, ?, ?, ?)",
  );
  const customers = [
    ["1", "Acme Corp", "NA", 12400, "Active"],
    ["2", "Globex", "EU", 9800, "Active"],
    ["3", "Initech", "APAC", 7200, "Pending"],
    ["4", "Umbrella", "NA", 15600, "Active"],
    ["5", "Stark Ind", "EU", 22100, "At risk"],
    ["6", "Wayne Ent", "NA", 18400, "Active"],
    ["7", "Hooli", "APAC", 6400, "Pending"],
  ] as const;
  for (const row of customers) cust.run(...row);

  const line = insert(
    "INSERT INTO invoice_lines (number, client, due, item, qty, price) VALUES (?, ?, ?, ?, ?, ?)",
  );
  line.run("INV-2048", "Acme Corp", "2026-10-15", "Platform license", 1, 2400);
  line.run("INV-2048", "Acme Corp", "2026-10-15", "Support", 1, 600);
  line.run("INV-2049", "Globex", "2026-10-20", "Seats", 12, 99);

  const task = insert(
    "INSERT INTO tasks (column_id, column_title, title) VALUES (?, ?, ?)",
  );
  task.run("todo", "To do", "Spec review");
  task.run("todo", "To do", "API contract");
  task.run("doing", "In progress", "Dashboard tiles");
  task.run("done", "Done", "Jev wiring");

  const member = insert("INSERT INTO team (name, role, status) VALUES (?, ?, ?)");
  member.run("Ana Rivera", "PM", "online");
  member.run("Ben Okonkwo", "Eng", "online");
  member.run("Chen Wei", "Design", "away");

  const act = insert(
    "INSERT INTO activity (who, action, when_label) VALUES (?, ?, ?)",
  );
  act.run("Ana", "updated KPI targets", "2m ago");
  act.run("Ben", "merged PR #42", "18m ago");
  act.run("Chen", "commented on layout", "1h ago");

  const review = insert(
    "INSERT INTO reviews (author, rating, text) VALUES (?, ?, ?)",
  );
  review.run("Maya", 5, "Dashboard updates as we type.");
  review.run("Omar", 4, "Premade tiles feel polished.");

  const region = insert("INSERT INTO regions (region, value) VALUES (?, ?)");
  region.run("North America", 42);
  region.run("Europe", 31);
  region.run("APAC", 27);

  insert(
    "INSERT INTO sla (id, uptime, target, incidents, level, message) VALUES (1, 99.92, 99.9, 1, 'warning', 'Elevated API latency in eu-west')",
  ).run();
  const svc = insert("INSERT INTO services (name, status) VALUES (?, ?)");
  svc.run("API", "degraded");
  svc.run("Workers", "ok");
  svc.run("Database", "ok");

  const stage = insert("INSERT INTO funnel (stage, value, ord) VALUES (?, ?, ?)");
  stage.run("Visitors", 12000, 1);
  stage.run("Signups", 3200, 2);
  stage.run("Activated", 1800, 3);
  stage.run("Paid", 420, 4);
}

export function getDb() {
  if (db) return db;
  const dir = path.join(process.cwd(), ".data");
  mkdirSync(dir, { recursive: true });
  db = new DatabaseSync(path.join(dir, "workspace.db"));
  seed(db);
  return db;
}
