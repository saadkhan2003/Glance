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

/** Workers have no durable local disk. Use a Cloudflare binding for the public demo. */
export async function reserveWorkerRequest(): Promise<boolean> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as unknown as {
      JEV_RATE_LIMITER?: { limit(options: { key: string }): Promise<{ success: boolean }> };
    };
    if (!env.JEV_RATE_LIMITER) return false;
    const result = await env.JEV_RATE_LIMITER.limit({ key: "public-jev" });
    return result.success;
  } catch {
    return false;
  }
}
