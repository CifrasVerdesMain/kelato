import { getSalesData, getCostsData } from "@/lib/sheets";
import Dashboard from "@/components/Dashboard";
import { format, parseISO, isValid } from "date-fns";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

function safeParseMonth(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    if (isValid(d)) return format(d, "yyyy-MM");
  } catch {}
  if (/^\d{4}-\d{2}$/.test(dateStr)) return dateStr;
  return dateStr;
}

export default async function HomePage() {
  const [salesData, costsData] = await Promise.all([
    getSalesData(),
    getCostsData(),
  ]);

  // Daily revenue
  const dailyMap = new Map<string, number>();
  for (const row of salesData) {
    if (!row.date) continue;
    dailyMap.set(row.date, (dailyMap.get(row.date) ?? 0) + row.final_net_sales);
  }
  const dailyRevenue = Array.from(dailyMap.entries())
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Monthly revenue
  const monthlyRevenueMap = new Map<string, number>();
  for (const row of salesData) {
    if (!row.date) continue;
    const month = safeParseMonth(row.date);
    monthlyRevenueMap.set(month, (monthlyRevenueMap.get(month) ?? 0) + row.final_net_sales);
  }

  // Monthly costs
  const monthlyCostMap = new Map<string, number>();
  for (const row of costsData) {
    if (!row.date) continue;
    const month = safeParseMonth(row.date);
    monthlyCostMap.set(month, (monthlyCostMap.get(month) ?? 0) + row.amount);
  }

  const allMonths = new Set([...monthlyRevenueMap.keys(), ...monthlyCostMap.keys()]);
  const monthlyTrends = Array.from(allMonths)
    .sort()
    .map((month) => {
      const revenue = monthlyRevenueMap.get(month) ?? 0;
      const cost = monthlyCostMap.get(month) ?? 0;
      return { month, revenue, cost, profit: revenue - cost };
    });

  // Top flavors
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

  // Sales by presentation
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

  // Summary KPIs
  const totalRevenue = salesData.reduce((s, r) => s + r.final_net_sales, 0);
  const totalCost = costsData.reduce((s, r) => s + r.amount, 0);
  const totalQty = salesData.reduce((s, r) => s + r.qty, 0);
  const totalOrders = salesData.reduce((s, r) => s + r.receipts_count, 0);
  const roi = totalCost > 0 ? ((totalRevenue - totalCost) / totalCost) * 100 : null;

  const dashboardData = {
    summary: {
      totalRevenue,
      totalCost,
      totalQty,
      totalOrders,
      roi,
      profit: totalRevenue - totalCost,
    },
    dailyRevenue,
    monthlyTrends,
    topFlavors,
    salesByPresentation,
  };

  return <Dashboard data={dashboardData} />;
}
