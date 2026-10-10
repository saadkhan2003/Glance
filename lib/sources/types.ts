export const SOURCE_IDS = [
  "workspace",
  "revenue",
  "customers",
  "invoices",
  "tasks",
  "team",
  "reviews",
] as const;

export type SourceId = (typeof SOURCE_IDS)[number];

export type WorkspaceSnapshot = {
  origin: "sqlite" | "demo" | "import" | "empty";
  updatedAt?: string;
  matched: string[];
  focus: SourceId;
  revenue: {
    labels: string[];
    values: number[];
    costs: number[];
    current: number;
    previous: number;
    goal: number;
  };
  customers: {
    rows: {
      id: string;
      name: string;
      region: string;
      amount: number;
      status: string;
    }[];
  };
  invoice: {
    number: string;
    client: string;
    due: string;
    lines: { item: string; qty: number; price: number }[];
  };
  tasks: { columns: { id: string; title: string; cards: string[] }[] };
  team: { members: { name: string; role: string; status: string }[] };
  activity: { items: { who: string; action: string; when: string }[] };
  reviews: { reviews: { author: string; rating: number; text: string }[] };
  regions: { regions: { region: string; value: number }[] };
  sla: {
    uptime: number;
    target: number;
    incidents: number;
    level: string;
    message: string;
    services: { name: string; status: string }[];
  };
  funnel: { stages: { stage: string; value: number }[] };
};
