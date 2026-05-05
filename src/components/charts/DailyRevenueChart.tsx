"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";

interface DailyDataPoint {
  date: string;
  revenue: number;
}

function formatDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isValid(d)) return format(d, "d MMM", { locale: es });
  } catch {}
  return dateStr;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

export default function DailyRevenueChart({ data }: { data: DailyDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm opacity-50">
        Sin datos
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, label: formatDate(d.date) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#B5432A" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#B5432A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8D9CE" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#8B6B5C" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8B6B5C" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value ?? 0)), "Ingresos"]}
          labelFormatter={(label) => label}
          contentStyle={{
            background: "#FFFFFF",
            border: "1px solid #E8D9CE",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#B5432A"
          strokeWidth={2}
          fill="url(#revenueGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "#B5432A" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
