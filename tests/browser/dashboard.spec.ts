import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";
import demo from "../../lib/dashboard/demo.json";

const importPayload = {
  revenue: demo.revenue,
  customers: demo.customers,
  invoice: demo.invoice,
};

async function importWorkspace(page: import("@playwright/test").Page) {
  await page.getByText("Bring your own data", { exact: true }).click();
  await page.getByLabel("JSON data", { exact: true }).fill(JSON.stringify(importPayload));
  await page.getByRole("button", { name: "Apply JSON" }).click();
}

test("imported data generates, filters, exports and restores a saved view", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Your dashboard starts empty", exact: true })).toBeVisible();
  await importWorkspace(page);
  await page.getByLabel("Ask").fill("Revenue trend and top customers");
  await page.getByRole("button", { name: "Generate dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Revenue trend and top customers", exact: true })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Local selection · no model request needed" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Dashboard filters" })).toBeVisible();
  await page.getByLabel("Customer status", { exact: true }).selectOption("At risk");
  await expect(page.getByRole("region", { name: "Customer table", exact: true })).toContainText("Stark Ind");
  await expect(page.getByRole("region", { name: "Customer table", exact: true })).not.toContainText("Acme Corp");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV" }).click();
  const download = await downloadEvent;
  const file = await download.path();
  expect(readFileSync(file!, "utf8")).toContain("Stark Ind");
  await page.getByRole("button", { name: "Save view" }).click();
  await page.getByLabel("Dashboard name").fill("Risk review");
  await page.getByRole("button", { name: "Save dashboard", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Risk review", exact: true }).click();
  await expect(page.getByLabel("Customer status", { exact: true })).toHaveValue("At risk");
  expect(errors).toEqual([]);
});

test("import validates errors and changes metrics", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Bring your own data", { exact: true }).click();
  await page.getByLabel("JSON data", { exact: true }).fill("{invalid");
  await page.getByRole("button", { name: "Apply JSON" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Invalid JSON" })).toBeVisible();
  await page.getByLabel("JSON data", { exact: true }).fill(
    JSON.stringify({ customers: { rows: [{ id: "x", name: "Imported account", region: "EU", amount: 1500.25, status: "Active" }] } }),
  );
  await page.getByRole("button", { name: "Apply JSON" }).click();
  await expect(page.getByRole("heading", { name: "Ready to generate" })).toBeVisible();
  await page.getByLabel("Ask").fill("Top customers");
  await page.getByRole("button", { name: "Generate dashboard" }).click();
  await expect(page.getByRole("region", { name: "Customer table", exact: true })).toContainText("Imported account");
  await expect(page.getByRole("region", { name: "Customer count", exact: true })).toContainText("1");
  await expect(page.getByLabel("Source", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Revenue from", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Customer region", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Customer status", { exact: true }).locator("option")).toHaveCount(2);
});

test("uploaded table fields filter rows immediately", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Bring your own data", { exact: true }).click();
  await page.getByLabel("JSON data", { exact: true }).fill(JSON.stringify({ tables: { items: [{ id: "contacts", title: "Contacts", columns: ["Name", "City"], rows: [{ Name: "Lina", City: "Lahore" }, { Name: "Sam", City: "Karachi" }] }] } }));
  await page.getByRole("button", { name: "Apply JSON" }).click();
  await expect(page.getByLabel("Contacts · City")).toBeVisible();
  await page.getByLabel("Ask").fill("Show imported sheet");
  await page.getByRole("button", { name: "Generate dashboard" }).click();
  await page.getByLabel("Contacts · City").fill("lah");
  await expect(page.getByRole("region", { name: "Imported sheet", exact: true })).toContainText("Lina");
  await expect(page.getByRole("region", { name: "Imported sheet", exact: true })).not.toContainText("Sam");
  await expect(page.getByText("Contacts: 1 rows")).toBeVisible();
});

test("customer CSV does not show duplicate column filters and can be cleared", async ({ page }) => {
  await page.goto("/");
  await page.getByText("Bring your own data", { exact: true }).click();
  await page.getByLabel("JSON data", { exact: true }).fill(JSON.stringify({
    customers: { rows: [{ id: "1", name: "Acme", region: "NA", amount: 100, status: "Active" }] },
    tables: { items: [{ id: "csv", title: "CSV", columns: ["id", "name", "region", "amount", "status"], rows: [{ id: 1, name: "Acme", region: "NA", amount: 100, status: "Active" }] }] },
  }));
  await page.getByRole("button", { name: "Apply JSON" }).click();
  await expect(page.getByLabel("Customer region")).toBeVisible();
  await expect(page.getByLabel("CSV · name")).toHaveCount(0);
  await expect(page.getByText("CSV: 1 rows")).toHaveCount(0);
  await page.getByRole("button", { name: "Clear data" }).click();
  await expect(page.getByRole("heading", { name: "Your dashboard starts empty" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Dashboard filters" })).toHaveCount(0);
});

test("typing and importing do not request or render a dashboard", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/dashboard", async route => { requests++; await route.continue(); });
  await page.goto("/");
  await importWorkspace(page);
  await page.getByLabel("Ask").fill("Revenue trend and top customers");
  await page.waitForTimeout(600);
  expect(requests).toBe(0);
  await expect(page.getByRole("heading", { name: "Ready to generate" })).toBeVisible();
  await expect(page.locator("[data-widget]")).toHaveCount(0);
  await page.getByRole("button", { name: "Generate dashboard" }).click();
  await expect.poll(() => requests).toBe(1);
  await expect(page.locator("[data-widget]")).not.toHaveCount(0);
});

test("sample data and suggested questions prepare a demo without AI usage", async ({ page }) => {
  let requests = 0;
  await page.route("**/api/dashboard", async route => { requests++; await route.continue(); });
  await page.goto("/");
  await page.getByRole("button", { name: "Load sample data" }).last().click();
  await expect(page.getByText(/Example workspace ·/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ready to generate" })).toBeVisible();
  await page.getByRole("button", { name: "Which customers are at risk?" }).click();
  await expect(page.getByLabel("Ask")).toHaveValue("Which customers are at risk?");
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Generate dashboard" }).click();
  await expect.poll(() => requests).toBe(1);
});

test("feedback and pilot forms ask about real reports", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Give feedback" }).click();
  await expect(page.getByLabel("What report do you make today?")).toBeVisible();
  await expect(page.getByLabel("Did Glance handle your data?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send feedback" }).locator("xpath=ancestor::form")).toHaveAttribute("action", "https://formsubmit.co/msaad.official6@gmail.com");
  await page.getByRole("checkbox", { name: "I would like to join a pilot" }).check();
  await expect(page.getByLabel("Your email (required for the pilot)")).toHaveAttribute("required", "");
  await page.getByRole("dialog").press("Escape");
  await page.getByRole("button", { name: "Request a pilot" }).click();
  await expect(page.getByRole("heading", { name: "Request a Glance pilot" })).toBeVisible();
  await page.getByLabel("What report do you make today?").fill("Weekly client revenue report");
  await page.getByLabel("Did Glance handle your data?").selectOption("Partly");
  await page.getByLabel("Your email (required for the pilot)").fill("tester@example.com");
  expect(await page.locator('form[action^="https://formsubmit.co/"]').evaluate(form => (form as HTMLFormElement).checkValidity())).toBe(true);
  let submitted = "";
  await page.route("https://formsubmit.co/**", async route => { submitted = route.request().postData() ?? ""; await route.fulfill({ status: 200, contentType: "text/html", body: "Submitted" }); });
  await page.getByRole("button", { name: "Send pilot request" }).click();
  await expect.poll(() => submitted).toContain("Weekly+client+revenue+report");
  expect(submitted).toContain("tester%40example.com");
  expect(submitted).toContain("pilot=Yes");
});

test("manual layout, widgets and offline fallback", async ({ page }) => {
  await page.goto("/");
  await importWorkspace(page);
  await page.getByLabel("Ask").fill("Revenue trend and top customers");
  await page.getByRole("button", { name: "Generate dashboard" }).click();
  await expect(page.getByRole("heading", { name: "Revenue trend and top customers", exact: true })).toBeVisible();
  await page.getByLabel("Layout", { exact: true }).selectOption("wide");
  await page.getByLabel("Add a widget", { exact: true }).selectOption("average-deal");
  await expect(page.getByRole("region", { name: "Average deal size", exact: true })).toContainText("12,625");
  await page.getByRole("button", { name: "Move Average deal size earlier", exact: true }).click();
  await page.getByRole("button", { name: "Remove Average deal size", exact: true }).click();
  await expect(page.getByRole("region", { name: "Average deal size", exact: true })).toHaveCount(0);
  await page.route("**/api/dashboard", (route) => route.abort());
  await page.getByLabel("Ask").fill("Invoice for Acme and conversion funnel");
  await page.getByRole("button", { name: "Generate dashboard" }).click();
  await expect(page.getByRole("region", { name: "Invoice", exact: true })).toContainText("3,396");
  await expect(page.getByRole("status").filter({ hasText: "local selection is ready" })).toBeVisible();
});

test("desktop and mobile are accessible without horizontal overflow", async ({ page }) => {
  for (const width of [1440, 768, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Your dashboard starts empty", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    expect(results.violations).toEqual([]);
    await page.screenshot({ path: `test-results/dashboard-${width}.png`, fullPage: true });
  }
});
