import { existsSync, readFileSync, readdirSync } from "node:fs";

const files = readdirSync(process.cwd()).filter((name) =>
  name !== ".env.example" && (/^\.env(?:\..*)?$/.test(name) || /^\.dev\.vars(?:\..*)?$/.test(name))
);
const hasKey = (content) => content.split(/\r?\n/).some((line) => {
  const match = line.match(/^\s*(?:export\s+)?OPENROUTER_API_KEY\s*=\s*(.*)$/);
  return Boolean(match?.[1]?.trim().replace(/^['"]|['"]$/g, ""));
});
const unsafeFiles = files.filter((name) => existsSync(name) && hasKey(readFileSync(name, "utf8")));

if (process.env.OPENROUTER_API_KEY || unsafeFiles.length) {
  console.error(`Cloudflare build stopped: OPENROUTER_API_KEY is set in the process or ${unsafeFiles.join(", ") || "a local environment file"}. Configure it with Wrangler as a Worker secret instead.`);
  process.exit(1);
}
