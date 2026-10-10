"use client";

import {
  ChartContainer,
  Recharts,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";

const lineConfig = {
  value: { label: "Value", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function LineSeriesChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const data = labels.map((l, i) => ({ name: l, value: values[i] ?? 0 }));
  return (
    <ChartContainer config={lineConfig} className="h-[200px] w-full">
      <Recharts.LineChart data={data}>
        <Recharts.CartesianGrid strokeDasharray="3 3" vertical={false} />
        <Recharts.XAxis dataKey="name" tickLine={false} axisLine={false} />
        <Recharts.YAxis tickLine={false} axisLine={false} width={40} />
        <Recharts.Tooltip />
        <Recharts.Line
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2}
          dot={false}
        />
      </Recharts.LineChart>
    </ChartContainer>
  );
}

export function BarSeriesChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const data = labels.map((l, i) => ({ name: l, value: values[i] ?? 0 }));
  return (
    <ChartContainer config={lineConfig} className="h-[200px] w-full">
      <Recharts.BarChart data={data}>
        <Recharts.CartesianGrid strokeDasharray="3 3" vertical={false} />
        <Recharts.XAxis dataKey="name" tickLine={false} axisLine={false} />
        <Recharts.YAxis tickLine={false} axisLine={false} width={40} />
        <Recharts.Tooltip />
        <Recharts.Bar
          dataKey="value"
          fill="var(--color-value)"
          radius={[4, 4, 0, 0]}
        />
      </Recharts.BarChart>
    </ChartContainer>
  );
}

export function AreaSeriesChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const data = labels.map((l, i) => ({ name: l, value: values[i] ?? 0 }));
  return (
    <ChartContainer config={lineConfig} className="h-[200px] w-full">
      <Recharts.AreaChart data={data}>
        <Recharts.CartesianGrid strokeDasharray="3 3" vertical={false} />
        <Recharts.XAxis dataKey="name" tickLine={false} axisLine={false} />
        <Recharts.YAxis tickLine={false} axisLine={false} width={40} />
        <Recharts.Tooltip />
        <Recharts.Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          fill="var(--color-value)"
          fillOpacity={0.2}
        />
      </Recharts.AreaChart>
    </ChartContainer>
  );
}

export function PieSeriesChart({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const data = labels.map((l, i) => ({ name: l, value: values[i] ?? 0 }));
  const config = labels.reduce((acc, l, i) => {
    acc[l] = {
      label: l,
      color: `var(--chart-${(i % 5) + 1})`,
    };
    return acc;
  }, {} as ChartConfig);
  return (
    <ChartContainer config={config} className="h-[200px] w-full">
      <Recharts.PieChart>
        <Recharts.Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          outerRadius={70}
        >
          {data.map((row, i) => <Recharts.Cell key={row.name} fill={`var(--chart-${(i % 5) + 1})`} />)}
        </Recharts.Pie>
        <Recharts.Tooltip />
        <Recharts.Legend />
      </Recharts.PieChart>
    </ChartContainer>
  );
}

export function StackedBarSeriesChart({
  labels,
  series,
}: {
  labels: string[];
  series: { name: string; values: number[] }[];
}) {
  const data = labels.map((l, i) => {
    const row: Record<string, string | number> = { name: l };
    series.forEach((s) => {
      row[s.name] = s.values[i] ?? 0;
    });
    return row;
  });
  const config = series.reduce((acc, s, i) => {
    acc[s.name] = {
      label: s.name,
      color: `var(--chart-${(i % 5) + 1})`,
    };
    return acc;
  }, {} as ChartConfig);
  return (
    <ChartContainer config={config} className="h-[200px] w-full">
      <Recharts.BarChart data={data}>
        <Recharts.CartesianGrid strokeDasharray="3 3" vertical={false} />
        <Recharts.XAxis dataKey="name" tickLine={false} axisLine={false} />
        <Recharts.YAxis tickLine={false} axisLine={false} width={40} />
        <Recharts.Tooltip />
        <Recharts.Legend />
        {series.map((s) => (
          <Recharts.Bar
            key={s.name}
            dataKey={s.name}
            stackId="a"
            fill={`var(--color-${s.name})`}
          />
        ))}
      </Recharts.BarChart>
    </ChartContainer>
  );
}
