import { getSalesData, getRevenueData } from "@/lib/sheets";
import Dashboard from "@/components/Dashboard";
import { format, parseISO, isValid } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function HomePage() {
  try {
    return await DashboardPage();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "var(--background)" }}>
        <div className="max-w-lg w-full rounded-xl p-6 shadow" style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}>
          <h1 className="text-lg font-bold mb-2" style={{ color: "var(--primary)" }}>Error al cargar datos</h1>
          <p className="text-sm mb-4 opacity-70">No se pudo conectar con Google Sheets. Verifica las variables de entorno en Vercel.</p>
          <pre className="text-xs p-3 rounded overflow-auto" style={{ background: "var(--muted)", color: "var(--foreground)" }}>{message}</pre>
        </div>
      </div>
    );
  }
}

function safeParseMonth(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isValid(d)) return format(d, "yyyy-MM");
  } catch {}
  if (/^\d{4}-\d{2}$/.test(dateStr)) return dateStr;
  return dateStr;
}

async function DashboardPage() {
  const [salesData, revenueData] = await Promise.all([
    getSalesData(),
    getRevenueData(),
  ]);

  // Daily revenue from REVENUE_TAB (already net of expenses)
  const dailyRevenue = revenueData
    .filter((r) => r.date)
    .map((r) => ({
      date: r.date,
      ingresos: r.ingresosNetos,
      gastos: r.gastos,
      ganancia: r.ganancia,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Monthly trends aggregated from REVENUE_TAB
  const monthlyMap = new Map<string, { ingresos: number; gastos: number; ganancia: number }>();
  for (const row of revenueData) {
    if (!row.date) continue;
    const month = safeParseMonth(row.date);
    const cur = monthlyMap.get(month) ?? { ingresos: 0, gastos: 0, ganancia: 0 };
    monthlyMap.set(month, {
      ingresos: cur.ingresos + row.ingresosNetos,
      gastos: cur.gastos + row.gastos,
      ganancia: cur.ganancia + row.ganancia,
    });
  }
  const monthlyTrends = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({ month, ...data }));

  // Top flavors from sales data
  const flavorMap = new Map<string, { revenue: number; qty: number }>();
  for (const row of salesData) {
    if (!row.flavor || row.flavor === "N/A") continue;
    const cur = flavorMap.get(row.flavor) ?? { revenue: 0, qty: 0 };
    flavorMap.set(row.flavor, {
      revenue: cur.revenue + row.final_net_sales,
      qty: cur.qty + row.qty,
    });
  }
  const topFlavors = Array.from(flavorMap.entries())
    .map(([flavor, data]) => ({ flavor, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 12);

  // Sales by presentation from sales data
  const presentationMap = new Map<string, number>();
  for (const row of salesData) {
    if (!row.presentation) continue;
    presentationMap.set(
      row.presentation,
      (presentationMap.get(row.presentation) ?? 0) + row.final_net_sales
    );
  }
  const salesByPresentation = Array.from(presentationMap.entries())
    .map(([presentation, revenue]) => ({ presentation, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  // Summary KPIs from REVENUE_TAB
  const totalIngresos = revenueData.reduce((s, r) => s + r.ingresosNetos, 0);
  const totalGastos = revenueData.reduce((s, r) => s + r.gastos, 0);
  const totalGanancia = revenueData.reduce((s, r) => s + r.ganancia, 0);
  const totalQty = salesData.reduce((s, r) => s + r.qty, 0);
  const totalOrders = salesData.reduce((s, r) => s + r.receipts_count, 0);
  const roi = totalGastos > 0 ? (totalGanancia / totalGastos) * 100 : null;

  const dashboardData = {
    summary: {
      totalRevenue: totalIngresos,
      totalCost: totalGastos,
      totalQty,
      totalOrders,
      roi,
      profit: totalGanancia,
    },
    dailyRevenue,
    monthlyTrends,
    topFlavors,
    salesByPresentation,
  };

  return <Dashboard data={dashboardData} />;
}
