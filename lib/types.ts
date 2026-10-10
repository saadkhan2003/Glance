export type JsonRecord = Record<string, unknown>;

export interface TileBindResult {
  title: string;
  subtitle?: string;
  isSample: boolean;
  payload: JsonRecord;
}

export interface CatalogTile {
  id: string;
  family: string;
  label: string;
  /** Criteria Jev reads via Rank labelOf */
  when: string;
  bind: (prompt: string, data: unknown) => TileBindResult;
}

export type LayoutKey =
  | "heroPlusRail"
  | "equalGrid"
  | "wideTable"
  | "kpiRowThenCharts";

export type TileProps = TileBindResult & { tileId: string };
