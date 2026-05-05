"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";

interface MonthlyDataPoint {
  month: string;
  revenue: number;
  cost: number;
  profit: number;
}

function formatMonth(m: string): string {
  try {
    const d = parseISO(`${m}-01`);
    if (isValid(d)) return format(d, "MMM yy", { locale: es });
  } catch {}
  return m;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

export default function MonthlyTrendsChart({ data }: { data: MonthlyDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm opacity-50">
        Sin datos
      </div>
    );
  }

  const chartData = data.map((d) => ({ ...d, label: formatMonth(d.month) }));
  const hasCosts = data.some((d) => d.cost > 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E8D9CE" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#8B6B5C" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#8B6B5C" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <Tooltip
          formatter={(value, name) => {
            const labels: Record<string, string> = {
              revenue: "Ingresos",
              cost: "Costos",
              profit: "Utilidad",
            };
            return [formatCurrency(Number(value ?? 0)), labels[String(name)] ?? String(name)];
          }}
          labelFormatter={(label) => label}
          contentStyle={{
            background: "#FFFFFF",
            border: "1px solid #E8D9CE",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(value) =>
            ((({ revenue: "Ingresos", cost: "Costos", profit: "Utilidad" } as Record<string, string>)[value]) ?? value)
          }
          wrapperStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="revenue" fill="#B5432A" radius={[4, 4, 0, 0]} />
        {hasCosts && (
          <Bar dataKey="cost" fill="#E8A090" radius={[4, 4, 0, 0]} />
        )}
        {hasCosts && (
          <Bar dataKey="profit" fill="#D4724A" radius={[4, 4, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
