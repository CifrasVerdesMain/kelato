"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PresentationDataPoint {
  presentation: string;
  revenue: number;
}

const COLORS = [
  "#B5432A", "#D4724A", "#E8A090", "#EFB898",
  "#A83820", "#C05040", "#D46A50", "#BE4D34",
];

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(1)}%`;
}

export default function PresentationChart({ data }: { data: PresentationDataPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-sm opacity-50">
        Sin datos
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.revenue, 0);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="revenue"
          nameKey="presentation"
          cx="50%"
          cy="45%"
          innerRadius={65}
          outerRadius={100}
          paddingAngle={3}
          label={({ name, value, cx, x, y }) => {
            const v = Number(value ?? 0);
            return (
              <text
                x={x}
                y={y}
                fill="#2D1810"
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
                fontSize={11}
              >
                {`$${(v / 1000).toFixed(1)}k`}
              </text>
            );
          }}
          labelLine={{ stroke: "#C8B0A0", strokeWidth: 1 }}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => {
            const v = Number(value ?? 0);
            return [`${formatCurrency(v)} (${formatPercent(v, total)})`, String(name)];
          }}
          contentStyle={{
            background: "#FFFFFF",
            border: "1px solid #E8D9CE",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
