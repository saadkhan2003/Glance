import { binders } from "./bind";
import type { CatalogTile } from "./types";

export const TILE_CATALOG: CatalogTile[] = [
  {
    id: "kpi-single",
    family: "metrics",
    label: "Single KPI",
    when:
      "The user wants one headline number, total, count, or primary metric with optional change.",
    bind: binders.kpiSingle,
  },
  {
    id: "kpi-sparkline-row",
    family: "metrics",
    label: "KPI row with sparklines",
    when:
      "The user needs several related metrics at a glance with mini trends, like an executive summary row.",
    bind: binders.kpiSparklineRow,
  },
  {
    id: "kpi-delta",
    family: "metrics",
    label: "KPI vs previous period",
    when:
      "The user compares this period to last period, YoY, MoM, or before/after for one metric.",
    bind: binders.kpiDelta,
  },
  {
    id: "goal-progress",
    family: "metrics",
    label: "Goal / progress",
    when:
      "The user tracks progress toward a target, quota, OKR, or completion percentage.",
    bind: binders.goalProgress,
  },
  {
    id: "gauge",
    family: "metrics",
    label: "Gauge",
    when:
      "The user describes utilization, capacity, health score, or percentage of a limit.",
    bind: binders.gauge,
  },
  {
    id: "chart-line",
    family: "charts",
    label: "Line chart",
    when:
      "The user asks about trends over time, growth curves, or time-series patterns.",
    bind: binders.chartLine,
  },
  {
    id: "chart-bar",
    family: "charts",
    label: "Bar chart",
    when:
      "The user compares categories, segments, or discrete buckets side by side.",
    bind: binders.chartBar,
  },
  {
    id: "chart-stacked-bar",
    family: "charts",
    label: "Stacked bar chart",
    when:
      "The user wants composition across categories with multiple series stacked.",
    bind: binders.chartStackedBar,
  },
  {
    id: "chart-area",
    family: "charts",
    label: "Area chart",
    when:
      "The user emphasizes volume or cumulative totals over time with filled areas.",
    bind: binders.chartArea,
  },
  {
    id: "chart-pie",
    family: "charts",
    label: "Pie / donut chart",
    when:
      "The user asks for share, mix, distribution, or percentage breakdown of parts.",
    bind: binders.chartPie,
  },
  {
    id: "chart-funnel",
    family: "charts",
    label: "Funnel",
    when:
      "The user describes conversion stages, pipeline drop-off, or stepwise flow.",
    bind: binders.chartFunnel,
  },
  {
    id: "chart-heatmap",
    family: "charts",
    label: "Heatmap",
    when:
      "The user needs intensity across two dimensions like day-by-hour or grid patterns.",
    bind: binders.chartHeatmap,
  },
  {
    id: "data-table",
    family: "records",
    label: "Data table",
    when:
      "The user needs exact rows, customers, orders, inventory, or tabular records.",
    bind: binders.dataTable,
  },
  {
    id: "comparison-table",
    family: "records",
    label: "Comparison table",
    when:
      "The user compares two products, periods, teams, or variants across metrics.",
    bind: binders.comparisonTable,
  },
  {
    id: "pivot-summary",
    family: "records",
    label: "Pivot summary",
    when:
      "The user wants totals grouped by region, category, or dimension without raw rows.",
    bind: binders.pivotSummary,
  },
  {
    id: "invoice",
    family: "records",
    label: "Invoice / receipt",
    when:
      "The user mentions billing, invoice, receipt, line items, or payment due.",
    bind: binders.invoice,
  },
  {
    id: "profile-card",
    family: "records",
    label: "Profile card",
    when:
      "The user describes a person, contact, account owner, or user profile.",
    bind: binders.profileCard,
  },
  {
    id: "activity-feed",
    family: "records",
    label: "Activity feed",
    when:
      "The user wants recent events, audit log, notifications, or what happened lately.",
    bind: binders.activityFeed,
  },
  {
    id: "kanban",
    family: "work",
    label: "Kanban board",
    when:
      "The user tracks tasks in columns like todo, in progress, and done.",
    bind: binders.kanban,
  },
  {
    id: "timeline",
    family: "work",
    label: "Timeline",
    when:
      "The user lists events in chronological order or a project schedule.",
    bind: binders.timeline,
  },
  {
    id: "calendar",
    family: "work",
    label: "Calendar",
    when:
      "The user mentions dates, meetings, deadlines, or upcoming events.",
    bind: binders.calendar,
  },
  {
    id: "checklist",
    family: "work",
    label: "Checklist",
    when:
      "The user has tasks to complete, onboarding steps, or a todo checklist.",
    bind: binders.checklist,
  },
  {
    id: "alert-status",
    family: "ops",
    label: "Alerts / status",
    when:
      "The user monitors incidents, outages, warnings, or service health.",
    bind: binders.alertStatus,
  },
  {
    id: "sla-uptime",
    family: "ops",
    label: "SLA / uptime",
    when:
      "The user cares about uptime, SLA compliance, or reliability targets.",
    bind: binders.slaUptime,
  },
  {
    id: "team-roster",
    family: "ops",
    label: "Team roster",
    when:
      "The user lists team members, on-call, staffing, or who is available.",
    bind: binders.teamRoster,
  },
  {
    id: "form-summary",
    family: "ops",
    label: "Form / intake summary",
    when:
      "The user submitted or reviews form fields, lead intake, or application answers.",
    bind: binders.formSummary,
  },
  {
    id: "map-regions",
    family: "ops",
    label: "Regional map placeholder",
    when:
      "The user asks about geography, regions, countries, or territorial split.",
    bind: binders.mapRegions,
  },
  {
    id: "pricing-table",
    family: "commerce",
    label: "Pricing comparison",
    when:
      "The user compares plans, tiers, pricing, or subscription options.",
    bind: binders.pricingTable,
  },
  {
    id: "comments-reviews",
    family: "commerce",
    label: "Comments / reviews",
    when:
      "The user wants feedback, ratings, reviews, or social proof.",
    bind: binders.commentsReviews,
  },
  {
    id: "media-gallery",
    family: "commerce",
    label: "Media gallery",
    when:
      "The user references images, gallery, assets, or media strip.",
    bind: binders.mediaGallery,
  },
];

export function getTileById(id: string): CatalogTile | undefined {
  return TILE_CATALOG.find((t) => t.id === id);
}
