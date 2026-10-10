import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"./tests/browser",fullyParallel:false,workers:1,timeout:30000,
  use:{channel:process.env.BROWSER_CHANNEL || undefined,baseURL:"http://127.0.0.1:3100",trace:"retain-on-failure",screenshot:"only-on-failure"},
  reporter:[["list"],["html",{open:"never"}]],
  webServer:{command:"npm run start -- --hostname 127.0.0.1 --port 3100",url:"http://127.0.0.1:3100/api/health",reuseExistingServer:!process.env.CI,timeout:60000,env:{AI_ENABLED:"false"}},
});
