"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsData, CategoryPoint } from "@/server/services/analytics.service";

const PIE_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)", "#f59e0b", "#10b981", "#ec4899", "#64748b",
];

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--popover-foreground)",
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64 min-w-0 pl-0">
        {mounted ? (
          <ResponsiveContainer width="100%" height={256} minWidth={0}>
            {children as React.ReactElement}
          </ResponsiveContainer>
        ) : (
          <div className="h-64 w-full animate-pulse rounded-md bg-muted/40" />
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsCharts({ data }: { data: AnalyticsData }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ChartCard title="Daily completion %">
        <AreaChart data={data.daily} margin={{ left: 8, right: 12, top: 8 }}>
          <defs>
            <linearGradient id="score" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.5} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" domain={[0, 100]} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="score" stroke="var(--chart-1)" fill="url(#score)" strokeWidth={2} />
        </AreaChart>
      </ChartCard>

      <ChartCard title="Focus hours">
        <BarChart data={data.daily} margin={{ left: 8, right: 12, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="focusHours" fill="var(--chart-5)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Tasks completed trend">
        <LineChart data={data.daily} margin={{ left: 8, right: 12, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="completed" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
        </LineChart>
      </ChartCard>

      {data.categoryPerformance.length > 0 ? (
        <ChartCard title="Category performance">
          <PieChart>
            <Tooltip contentStyle={tooltipStyle} />
            <Pie
              data={data.categoryPerformance}
              dataKey="completed"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={90}
              label={(props: PieLabelRenderProps) => {
                const point = props.payload as CategoryPoint | undefined;
                return point?.label ?? "";
              }}
              labelLine={false}
              fontSize={10}
            >
              {data.categoryPerformance.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ChartCard>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Category performance</CardTitle>
          </CardHeader>
          <CardContent className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No completed tasks yet
          </CardContent>
        </Card>
      )}

      {data.debtByCategory.length > 0 && (
        <ChartCard title="Outstanding debt by category">
          <BarChart data={data.debtByCategory} layout="vertical" margin={{ left: 24, right: 12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
            <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={90} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="amount" fill="var(--chart-4)" radius={[0, 3, 3, 0]} />
          </BarChart>
        </ChartCard>
      )}

      <ChartCard title="XP earned per day">
        <BarChart data={data.daily} margin={{ left: 8, right: 12, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="xp" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ChartCard>
    </div>
  );
}
