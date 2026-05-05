import { google } from "googleapis";

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;
const SALES_TAB = process.env.SALES_TAB ?? "daily_sales_detail";
const COSTS_TAB = process.env.COSTS_TAB ?? "Costos";

function parseCurrency(s: string): number {
  if (!s) return 0;
  return parseFloat(s.replace(/[$,]/g, "")) || 0;
}

async function getSheets() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

export interface SalesRow {
  date: string;
  flavor: string;
  presentation: string;
  discount_flag: boolean;
  category: string;
  qty: number;
  gross_sales: number;
  discounts: number;
  net_sales: number;
  final_net_sales: number;
  receipts_count: number;
}

export interface CostRow {
  date: string;
  category: string;
  description: string;
  amount: number;
}

export async function getSalesData(): Promise<SalesRow[]> {
  const sheets = await getSheets();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SALES_TAB}!A:O`,
  });

  const rows = response.data.values ?? [];
  if (rows.length < 2) return [];

  const headers = rows[0].map((h: string) =>
    h.toLowerCase().replace(/\s+/g, "_")
  );

  return rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h: string, i: number) => {
      obj[h] = row[i] ?? "";
    });
    return {
      date: obj.date ?? "",
      flavor: obj.flavor ?? "",
      presentation: obj.presentation ?? "",
      discount_flag: obj.discount_flag === "TRUE",
      category: obj.category ?? "",
      qty: parseFloat(obj.qty) || 0,
      gross_sales: parseCurrency(obj.gross_sales),
      discounts: parseCurrency(obj.discounts),
      net_sales: parseCurrency(obj.net_sales),
      final_net_sales: parseCurrency(obj.final_net_sales),
      receipts_count: parseFloat(obj.receipts_count) || 0,
    };
  });
}

export async function getCostsData(): Promise<CostRow[]> {
  const sheets = await getSheets();
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${COSTS_TAB}!A:D`,
    });

    const rows = response.data.values ?? [];
    if (rows.length < 2) return [];

    const headers = rows[0].map((h: string) =>
      h.toLowerCase().replace(/\s+/g, "_")
    );

    return rows.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h: string, i: number) => {
        obj[h] = row[i] ?? "";
      });
      // Support common Spanish column names for the amount
      const amount =
        obj.amount ?? obj.monto ?? obj.costo ?? obj.importe ?? "";
      return {
        date: obj.date ?? obj.fecha ?? obj.month ?? obj.mes ?? "",
        category: obj.category ?? obj.categoria ?? "",
        description: obj.description ?? obj.descripcion ?? "",
        amount: parseCurrency(amount),
      };
    });
  } catch {
    // Costs tab is optional — return empty array if not found
    return [];
  }
}
