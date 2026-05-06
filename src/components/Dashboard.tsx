"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import DailyRevenueChart from "./charts/DailyRevenueChart";
import MonthlyTrendsChart from "./charts/MonthlyTrendsChart";
import TopFlavorsChart from "./charts/TopFlavorsChart";
import PresentationChart from "./charts/PresentationChart";

interface DashboardData {
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalQty: number;
    totalOrders: number;
    roi: number | null;
    profit: number;
  };
  dailyRevenue: { date: string; ingresos: number; gastos: number; ganancia: number }[];
  monthlyTrends: { month: string; ingresos: number; gastos: number; ganancia: number }[];
  topFlavors: { flavor: string; revenue: number; qty: number }[];
  salesByPresentation: { presentation: string; revenue: number }[];
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("es-MX", { maximumFractionDigits: 0 })}`;
}

function KPICard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5 shadow-sm"
      style={{
        background: highlight ? "var(--primary)" : "var(--card-bg)",
        border: highlight ? "none" : "1px solid var(--border)",
        color: highlight ? "#FFFFFF" : "var(--foreground)",
      }}
    >
      <p className="text-xs font-medium uppercase tracking-wide mb-1 opacity-70">
        {label}
      </p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 shadow-sm"
      style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
    >
      <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function Dashboard({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState<string>("all");

  const months = useMemo(() => {
    const set = new Set<string>();
    for (const d of data.dailyRevenue) {
      if (d.date?.length >= 7) set.add(d.date.slice(0, 7));
    }
    return Array.from(set).sort();
  }, [data.dailyRevenue]);

  const filteredDaily = useMemo(() => {
    if (selectedMonth === "all") return data.dailyRevenue;
    return data.dailyRevenue.filter((d) => d.date?.startsWith(selectedMonth));
  }, [data.dailyRevenue, selectedMonth]);

  const filteredSummary = useMemo(() => {
    if (selectedMonth === "all") return data.summary;
    const monthData = data.monthlyTrends.find((m) => m.month === selectedMonth);
    if (!monthData) return data.summary;
    return {
      ...data.summary,
      totalRevenue: monthData.ingresos,
      totalCost: monthData.gastos,
      profit: monthData.ganancia,
      roi: monthData.gastos > 0 ? (monthData.ganancia / monthData.gastos) * 100 : null,
    };
  }, [data.summary, data.monthlyTrends, selectedMonth]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function formatMonthLabel(m: string): string {
    const [year, month] = m.split("-");
    const names = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
    return `${names[parseInt(month) - 1]} ${year}`;
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 py-3 flex items-center justify-between shadow-sm"
        style={{ background: "var(--card-bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3">
          <Image src="/logo.jpeg" alt="Kelato" width={120} height={60} className="object-contain" priority />
          <span className="text-sm font-semibold hidden sm:block" style={{ color: "var(--primary)" }}>
            Dashboard
          </span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-sm rounded-lg px-3 py-1.5 outline-none cursor-pointer"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            <option value="all">Todo el período</option>
            {months.map((m) => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>

          <button
            onClick={handleLogout}
            className="text-sm px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 cursor-pointer"
            style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KPICard label="Ingresos netos" value={formatCurrency(filteredSummary.totalRevenue)} highlight />
          <KPICard
            label="Ganancia"
            value={formatCurrency(filteredSummary.profit)}
            sub={`Gastos: ${formatCurrency(filteredSummary.totalCost)}`}
          />
          <KPICard
            label="ROI"
            value={filteredSummary.roi !== null ? `${filteredSummary.roi.toFixed(1)}%` : "—"}
          />
          <KPICard
            label="Unidades vendidas"
            value={filteredSummary.totalQty.toLocaleString("es-MX")}
          />
        </div>

        {/* Charts — row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Ingresos, Gastos y Ganancia diarios">
            <DailyRevenueChart data={filteredDaily} />
          </ChartCard>
          <ChartCard title="Tendencia mensual">
            <MonthlyTrendsChart data={data.monthlyTrends} />
          </ChartCard>
        </div>

        {/* Charts — row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ChartCard title="Top sabores por ingresos">
            <TopFlavorsChart data={data.topFlavors} />
          </ChartCard>
          <ChartCard title="Ventas por presentación">
            <PresentationChart data={data.salesByPresentation} />
          </ChartCard>
        </div>
      </main>

      <footer className="text-center text-xs py-4 mt-4" style={{ color: "var(--primary-light)" }}>
        Cifras Verdes · Kelato · Datos actualizados cada hora
      </footer>
    </div>
  );
}
