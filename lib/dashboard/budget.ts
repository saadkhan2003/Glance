import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";

// Single Node process; mount this directory on a persistent volume in Docker.
export function reserveRequest(): boolean {
  const limit = Number(process.env.AI_DAILY_REQUEST_LIMIT ?? 100);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) return false;
  const dir = process.env.AI_BUDGET_DIR ?? path.join(process.cwd(), ".data", "ai-budget");
  const day = new Date().toISOString().slice(0,10);
  try {
    mkdirSync(dir,{recursive:true});
    const file = path.join(dir,"usage.json");
    let usage: {day:string; count:number} = {day,count:0};
    try { usage = JSON.parse(readFileSync(file,"utf8")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") return false; }
    if (typeof usage.day !== "string" || !Number.isInteger(usage.count) || usage.count < 0) return false;
    const count = usage.day === day ? usage.count : 0;
    if (count >= limit) return false;
    const temporary = `${file}.tmp`;
    writeFileSync(temporary,JSON.stringify({day,count:count+1})); renameSync(temporary,file);
    return true;
  } catch { return false; } // Fail closed: keep the free local dashboard available.
}

export const RESERVE_D1_SQL = `
UPDATE ai_budget
SET day_window = ?,
    day_count = CASE WHEN day_window = ? THEN day_count + 1 ELSE 1 END,
    minute_window = ?,
    minute_count = CASE WHEN minute_window = ? THEN minute_count + 1 ELSE 1 END
WHERE id = 1
  AND (day_window != ? OR day_count < ?)
  AND (minute_window != ? OR minute_count < ?)
`;

type BudgetDatabase = {
  prepare(query: string): {
    bind(...values: number[]): { run(): Promise<{ success: boolean; meta?: { changes?: number } }> };
  };
};

/** A single conditional update reserves both windows atomically on D1's primary. */
export async function reserveD1Request(
  db: BudgetDatabase,
  now: number,
  minuteLimit: number,
  dailyLimit: number,
): Promise<boolean> {
  if (!Number.isFinite(now) || !Number.isInteger(minuteLimit) || minuteLimit < 1 || minuteLimit > 1000
    || !Number.isInteger(dailyLimit) || dailyLimit < 1 || dailyLimit > 10000) return false;
  const minute = Math.floor(now / 60_000);
  const day = Math.floor(now / 86_400_000);
  try {
    const result = await db.prepare(RESERVE_D1_SQL)
      .bind(day, day, minute, minute, day, dailyLimit, minute, minuteLimit)
      .run();
    return result.success === true && result.meta?.changes === 1;
  } catch {
    return false;
  }
}

/** Workers use one shared D1 row; a missing binding fails closed. */
export async function reserveWorkerRequest(): Promise<boolean> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as unknown as {
      AI_BUDGET_DB?: BudgetDatabase;
      AI_MINUTE_REQUEST_LIMIT?: string;
      AI_DAILY_REQUEST_LIMIT?: string;
    };
    if (!env.AI_BUDGET_DB) return false;
    return await reserveD1Request(
      env.AI_BUDGET_DB,
      Date.now(),
      Number(env.AI_MINUTE_REQUEST_LIMIT),
      Number(env.AI_DAILY_REQUEST_LIMIT),
    );
  } catch {
    return false;
  }
}
