"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FlavorDataPoint {
  flavor: string;
  revenue: number;
  qty: number;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

const COLORS = [
  "#B5432A", "#C55B3E", "#D47252", "#E08A68", "#EAA280",
  "#EFB898", "#D46A50", "#C05040", "#A83820", "#952E18",
  "#BE4D34", "#CB6248",
];

export default function TopFlavorsChart({ data }: { data: FlavorDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm opacity-50">
        Sin datos
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 0, right: 20, left: 10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E8D9CE" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fontSize: 11, fill: "#8B6B5C" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
        />
        <YAxis
          type="category"
          dataKey="flavor"
          width={110}
          tick={{ fontSize: 11, fill: "#2D1810" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [formatCurrency(Number(value ?? 0)), "Ingresos"]}
          contentStyle={{
            background: "#FFFFFF",
            border: "1px solid #E8D9CE",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
