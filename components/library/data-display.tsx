import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export function RecordTable({
  rows,
  columns,
  maxHeight = "16rem",
}: {
  rows: Record<string, string | number>[];
  columns?: string[];
  maxHeight?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No rows</p>;
  }
  const cols = columns?.length ? columns : Object.keys(rows[0]);
  return (
    <div className="overflow-auto rounded-md border" style={{ maxHeight }} tabIndex={0} role="region" aria-label="Scrollable records">
      <Table>
        <TableHeader>
          <TableRow>
            {cols.map((c) => (
              <TableHead key={c} className="capitalize">
                {c}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {cols.map((c) => (
                <TableCell key={c} className="tabular-nums">
                  {String(row[c])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
