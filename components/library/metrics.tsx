import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function MetricValue({
  value,
  label,
  delta,
  unit,
}: {
  value: number | string;
  label?: string;
  delta?: number;
  unit?: string;
}) {
  return (
    <div>
      {label ? (
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
      ) : null}
      <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">
        {value}
        {unit ? (
          <span className="ml-1 text-lg font-normal text-muted-foreground">
            {unit}
          </span>
        ) : null}
      </p>
      {delta !== undefined ? (
        <Badge
          variant={delta >= 0 ? "success" : "destructive"}
          className="mt-2"
        >
          {delta >= 0 ? "+" : ""}
          {delta}% vs prior
        </Badge>
      ) : null}
    </div>
  );
}

export function SparklineRow({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="text-primary" aria-hidden>
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
      />
    </svg>
  );
}

export function GoalProgress({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label ?? "Progress"}</span>
        <span>{pct}%</span>
      </div>
      <Progress value={pct} />
      <Separator />
      <p className="text-xs text-muted-foreground">
        {value.toLocaleString()} / {max.toLocaleString()}
      </p>
    </div>
  );
}

export function RadialGauge({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label?: string;
}) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex flex-col items-center py-2">
      <div
        className={cn(
          "flex h-28 w-28 items-center justify-center rounded-full border-4 border-primary/30 text-2xl font-bold",
        )}
        style={{
          background: `conic-gradient(var(--primary) ${(value / max) * 360}deg, var(--muted) 0)`,
        }}
      >
        <span className="rounded-full bg-card px-3 py-2 text-foreground">
          {pct}%
        </span>
      </div>
      {label ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">{label}</p>
      ) : null}
    </div>
  );
}
