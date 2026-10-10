export type WidgetKind =
  | "stat"
  | "delta"
  | "progress"
  | "gauge"
  | "table"
  | "line"
  | "bar"
  | "area"
  | "stacked"
  | "pie"
  | "list"
  | "people"
  | "kanban"
  | "timeline"
  | "checklist"
  | "alert"
  | "funnel"
  | "accordion"
  | "tabs"
  | "badges"
  | "ranked"
  | "quotes"
  | "calendar"
  | "comparison"
  | "invoice"
  | "form"
  | "services";

export type WidgetSlice =
  | "revenue"
  | "costs"
  | "margin"
  | "customers"
  | "customers-region"
  | "customers-status"
  | "customers-risk"
  | "customers-top"
  | "invoice"
  | "tasks"
  | "tasks-open"
  | "team"
  | "team-online"
  | "activity"
  | "reviews"
  | "regions"
  | "sla"
  | "funnel"
  | "services";

export type WidgetSpec = {
  id: string;
  label: string;
  family: string;
  kind: WidgetKind;
  slice: WidgetSlice;
  when: string;
};

function w(
  id: string,
  family: string,
  kind: WidgetKind,
  slice: WidgetSlice,
  label: string,
  when: string,
): WidgetSpec {
  return { id, family, kind, slice, label, when };
}

export const WIDGETS: WidgetSpec[] = [
  w("revenue-headline", "metrics", "stat", "revenue", "Revenue headline", "Show the latest monthly revenue as one headline KPI."),
  w("revenue-mom", "metrics", "delta", "revenue", "Revenue vs last month", "Compare this month revenue to the previous month."),
  w("revenue-goal", "metrics", "progress", "revenue", "Revenue goal", "Show progress of revenue toward the annual goal."),
  w("revenue-gauge", "metrics", "gauge", "revenue", "Revenue capacity gauge", "Show revenue as a gauge against the goal."),
  w("cost-headline", "metrics", "stat", "costs", "Cost headline", "Show the latest monthly operating cost."),
  w("cost-mom", "metrics", "delta", "costs", "Cost vs last month", "Compare this month costs to last month."),
  w("margin-headline", "metrics", "stat", "margin", "Margin headline", "Show the latest gross margin dollars."),
  w("margin-rate", "metrics", "gauge", "margin", "Margin rate", "Show margin as a percent of revenue."),
  w("margin-progress", "metrics", "progress", "margin", "Margin progress", "Show margin progress against a target rate."),
  w("booked-revenue", "metrics", "stat", "customers", "Booked customer revenue", "Show the sum of customer contract amounts."),
  w("customer-count", "metrics", "stat", "customers", "Customer count", "Show how many customers are in the book."),
  w("average-deal", "metrics", "stat", "customers", "Average deal size", "Show the average customer amount."),
  w("largest-account", "metrics", "stat", "customers-top", "Largest account", "Show the single biggest customer amount."),
  w("at-risk-count", "metrics", "stat", "customers-risk", "At-risk accounts", "Count customers whose status is at risk."),
  w("pending-count", "metrics", "stat", "customers-status", "Pending accounts", "Count customers still pending."),
  w("active-count", "metrics", "stat", "customers-status", "Active accounts", "Count customers with active status."),
  w("uptime-headline", "metrics", "stat", "sla", "Uptime", "Show current uptime percent."),
  w("uptime-gauge", "metrics", "gauge", "sla", "Uptime gauge", "Show uptime on a gauge against 100 percent."),
  w("uptime-vs-target", "metrics", "progress", "sla", "SLA vs target", "Compare uptime to the SLA target."),
  w("incident-count", "metrics", "stat", "sla", "Open incidents", "Show how many incidents are recorded."),
  w("invoice-total", "metrics", "stat", "invoice", "Invoice total", "Show the total of the current invoice."),
  w("review-average", "metrics", "stat", "reviews", "Average rating", "Show the average review score."),
  w("review-count", "metrics", "stat", "reviews", "Review count", "Show how many reviews exist."),
  w("team-online", "metrics", "stat", "team-online", "People online", "Count team members currently online."),
  w("team-size", "metrics", "stat", "team", "Team size", "Show how many people are on the roster."),
  w("open-tasks", "metrics", "stat", "tasks-open", "Open tasks", "Count tasks that are not done."),
  w("done-tasks", "metrics", "stat", "tasks", "Completed tasks", "Count tasks in the done column."),
  w("funnel-conversion", "metrics", "stat", "funnel", "Paid conversion", "Show paid customers as a percent of visitors."),
  w("funnel-signups", "metrics", "stat", "funnel", "Signup count", "Show the signup stage volume."),
  w("region-leader", "metrics", "stat", "regions", "Leading region", "Show the region with the largest share."),

  w("revenue-line", "charts", "line", "revenue", "Revenue trend", "Line chart of revenue across months."),
  w("revenue-bars", "charts", "bar", "revenue", "Revenue by month", "Bar chart comparing revenue by month."),
  w("revenue-area", "charts", "area", "revenue", "Revenue volume", "Area chart of revenue over time."),
  w("cost-line", "charts", "line", "costs", "Cost trend", "Line chart of costs across months."),
  w("cost-bars", "charts", "bar", "costs", "Cost by month", "Bar chart of monthly costs."),
  w("cost-area", "charts", "area", "costs", "Cost volume", "Area chart of costs over time."),
  w("margin-bars", "charts", "bar", "margin", "Margin by month", "Bar chart of monthly margin."),
  w("margin-line", "charts", "line", "margin", "Margin trend", "Line chart of margin over time."),
  w("rev-cost-stack", "charts", "stacked", "revenue", "Revenue vs cost", "Stacked bars of revenue and cost by month."),
  w("region-pie", "charts", "pie", "regions", "Regional mix", "Pie chart of share by region."),
  w("region-bars", "charts", "bar", "regions", "Region comparison", "Bar chart of regional share."),
  w("status-pie", "charts", "pie", "customers-status", "Status mix", "Pie chart of customers by status."),
  w("status-bars", "charts", "bar", "customers-status", "Status counts", "Bar chart of customer status counts."),
  w("book-by-region", "charts", "bar", "customers-region", "Book by region", "Bar chart of customer amount summed by region."),
  w("book-pie", "charts", "pie", "customers-region", "Book mix", "Pie chart of booked amount by region."),
  w("top-account-bars", "charts", "bar", "customers-top", "Top accounts chart", "Bar chart of the largest customer amounts."),
  w("funnel-chart", "charts", "funnel", "funnel", "Conversion funnel", "Funnel of visitors, signups, activated, and paid."),
  w("review-bars", "charts", "bar", "reviews", "Ratings chart", "Bar chart of each review score."),
  w("service-bars", "charts", "bar", "services", "Service health chart", "Bar view of service status weights."),

  w("customer-table", "records", "table", "customers", "Customer table", "Table of every customer with region, amount, and status."),
  w("top-customer-table", "records", "table", "customers-top", "Top customers table", "Table of the highest-value customers."),
  w("risk-table", "records", "table", "customers-risk", "At-risk table", "Table of customers marked at risk."),
  w("region-table", "records", "table", "customers-region", "Region rollup table", "Table of totals grouped by region."),
  w("status-table", "records", "table", "customers-status", "Status rollup table", "Table of counts and totals by status."),
  w("revenue-table", "records", "table", "revenue", "Monthly revenue table", "Table of month, revenue, cost, and margin."),
  w("invoice-lines-table", "records", "table", "invoice", "Invoice lines", "Table of invoice line items, quantity, and price."),
  w("team-table", "records", "table", "team", "Team table", "Table of people, role, and status."),
  w("task-table", "records", "table", "tasks", "Task table", "Table of tasks and the column they sit in."),
  w("activity-table", "records", "table", "activity", "Activity table", "Table of recent actions."),
  w("review-table", "records", "table", "reviews", "Review table", "Table of authors, ratings, and comments."),
  w("funnel-table", "records", "table", "funnel", "Funnel table", "Table of funnel stages and volumes."),
  w("service-table", "records", "table", "services", "Service table", "Table of services and health."),
  w("region-share-table", "records", "table", "regions", "Region share table", "Table of geographic share values."),

  w("customer-ranked", "records", "ranked", "customers", "Ranked accounts", "Ranked list of customers by amount."),
  w("region-ranked", "records", "ranked", "customers-region", "Ranked regions", "Ranked list of regions by booked amount."),
  w("review-ranked", "records", "ranked", "reviews", "Ranked reviews", "Reviews ordered by rating."),
  w("funnel-ranked", "records", "ranked", "funnel", "Ranked stages", "Funnel stages ordered by volume."),

  w("customer-accordion", "records", "accordion", "customers", "Customer accordion", "Expandable list of customer records."),
  w("invoice-accordion", "records", "accordion", "invoice", "Invoice accordion", "Expandable invoice line items."),
  w("activity-accordion", "records", "accordion", "activity", "Activity accordion", "Expandable activity events."),
  w("region-tabs", "records", "tabs", "customers-region", "Customers by region tabs", "Tabs that split customers into regions."),
  w("status-tabs", "records", "tabs", "customers-status", "Customers by status tabs", "Tabs that split customers by status."),
  w("status-badges", "records", "badges", "customers-status", "Status badges", "Badge cloud of customer statuses."),
  w("region-badges", "records", "badges", "regions", "Region badges", "Badge cloud of regions and shares."),
  w("service-badges", "records", "badges", "services", "Service badges", "Badge cloud of service health."),
  w("region-compare", "records", "comparison", "customers-region", "Region comparison", "Side-by-side comparison of regional totals."),
  w("status-compare", "records", "comparison", "customers-status", "Status comparison", "Side-by-side comparison of status groups."),
  w("month-compare", "records", "comparison", "revenue", "Month comparison", "Compare the latest two revenue months."),

  w("invoice-card", "commerce", "invoice", "invoice", "Invoice", "Full invoice with client, due date, lines, and total."),
  w("invoice-form", "commerce", "form", "invoice", "Invoice summary", "Key-value summary of the open invoice."),
  w("customer-form", "commerce", "form", "customers-top", "Account summary", "Key-value summary of the largest account."),
  w("review-quotes", "commerce", "quotes", "reviews", "Review quotes", "Quoted customer reviews with star ratings."),
  w("review-list", "commerce", "list", "reviews", "Review list", "Simple list of review text."),
  w("pricing-from-deals", "commerce", "ranked", "customers-top", "Deal ladder", "Ladder of deal sizes from the customer book."),

  w("team-roster", "people", "people", "team", "Team roster", "People list with role and presence."),
  w("team-online-list", "people", "people", "team-online", "Who is online", "Only team members who are online."),
  w("owner-card", "people", "form", "team", "Owner card", "Profile-style summary of the first teammate."),
  w("activity-feed", "people", "list", "activity", "Activity feed", "Recent actions as a feed."),
  w("activity-timeline", "people", "timeline", "activity", "Activity timeline", "Chronological timeline of activity."),
  w("invoice-calendar", "people", "calendar", "invoice", "Due calendar", "Calendar entry for the invoice due date."),

  w("kanban-board", "work", "kanban", "tasks", "Kanban board", "Task board with todo, doing, and done columns."),
  w("task-checklist", "work", "checklist", "tasks", "Task checklist", "Checklist of every task, checked when done."),
  w("open-checklist", "work", "checklist", "tasks-open", "Open checklist", "Checklist of tasks that are not finished."),
  w("task-timeline", "work", "timeline", "tasks", "Task timeline", "Timeline of tasks in column order."),
  w("task-accordion", "work", "accordion", "tasks", "Task accordion", "Expandable tasks grouped by column."),
  w("task-badges", "work", "badges", "tasks", "Task column badges", "Badges showing how many tasks sit in each column."),

  w("sla-alert", "ops", "alert", "sla", "Status alert", "Alert banner for the current incident message."),
  w("service-list", "ops", "services", "services", "Service status", "List of services and whether they are healthy."),
  w("sla-form", "ops", "form", "sla", "SLA summary", "Key-value summary of uptime, target, and incidents."),
  w("region-list", "ops", "list", "regions", "Region list", "List of regions and their share."),
  w("region-progress", "ops", "progress", "regions", "Top region progress", "Progress bar for the leading region's share."),
  w("funnel-list", "ops", "list", "funnel", "Funnel list", "List of funnel stages and counts."),
  w("funnel-progress", "ops", "progress", "funnel", "Activation progress", "Progress from visitors to activated."),
  w("customer-list", "ops", "list", "customers", "Customer list", "Compact list of customer names and amounts."),
  w("risk-list", "ops", "list", "customers-risk", "At-risk list", "List of at-risk account names."),
  w("pending-list", "ops", "list", "customers-status", "Pending list", "List of pending accounts."),

  w("revenue-accordion", "charts", "accordion", "revenue", "Monthly accordion", "Expandable months with revenue and cost."),
  w("review-accordion", "commerce", "accordion", "reviews", "Review accordion", "Expandable reviews."),
  w("team-badges", "people", "badges", "team", "Role badges", "Badges of team roles."),
  w("online-badges", "people", "badges", "team-online", "Presence badges", "Badges for who is online or away."),
  w("invoice-badges", "commerce", "badges", "invoice", "Invoice badges", "Badges for invoice number, client, and due date."),
  w("funnel-badges", "ops", "badges", "funnel", "Funnel badges", "Badges for each funnel stage volume."),
  w("margin-table", "records", "table", "margin", "Margin table", "Table of monthly margin dollars and rate."),
  w("cost-table", "records", "table", "costs", "Cost table", "Table of monthly costs."),
  w("top5-ranked", "records", "ranked", "customers-top", "Top 5 accounts", "The five largest customers, ranked."),
  w("active-table", "records", "table", "customers-status", "Active customers", "Table filtered to active customers only."),
  w("na-book-stat", "metrics", "stat", "customers-region", "North America book", "Headline amount booked in North America."),
  w("eu-book-stat", "metrics", "stat", "customers-region", "Europe book", "Headline amount booked in Europe."),
  w("apac-book-stat", "metrics", "stat", "customers-region", "APAC book", "Headline amount booked in APAC."),
  w("degraded-services", "ops", "stat", "services", "Degraded services", "Count of services that are not ok."),
  w("healthy-services", "ops", "stat", "services", "Healthy services", "Count of services that are ok."),
  w("away-people", "people", "stat", "team", "People away", "Count of teammates marked away."),
  w("line-items", "commerce", "stat", "invoice", "Line item count", "How many lines are on the invoice."),
  w("paid-volume", "metrics", "stat", "funnel", "Paid volume", "Absolute count of the paid funnel stage."),
  w("visitor-volume", "metrics", "stat", "funnel", "Visitor volume", "Absolute count of the visitor stage."),
  w("activation-rate", "metrics", "gauge", "funnel", "Activation gauge", "Gauge of activated divided by signups."),
  w("risk-share", "metrics", "gauge", "customers-risk", "Risk share gauge", "Gauge of at-risk customers over the whole book."),
  w("online-share", "metrics", "gauge", "team-online", "Online share", "Gauge of online teammates over the roster."),
  w("goal-delta", "metrics", "delta", "revenue", "Gap to goal", "Delta between latest revenue and the goal is not used; compare revenue run-rate to prior."),
  w("customer-timeline", "people", "timeline", "customers-top", "Account timeline", "Timeline of the largest accounts."),
  w("service-alert", "ops", "alert", "services", "Service alert", "Alert when any service is degraded."),
  w("review-progress", "commerce", "progress", "reviews", "Rating progress", "Average rating as progress toward 5 stars."),
  w("task-progress", "work", "progress", "tasks", "Sprint progress", "Done tasks as progress of the whole board."),
  w("invoice-timeline", "commerce", "timeline", "invoice", "Billing timeline", "Timeline of invoice lines."),
  w("region-funnel", "charts", "funnel", "regions", "Region funnel", "Funnel-style bars of regional share."),
];

export const WIDGET_COUNT = WIDGETS.length;

export function widgetById(id: string): WidgetSpec | undefined {
  return WIDGETS.find((widget) => widget.id === id);
}
