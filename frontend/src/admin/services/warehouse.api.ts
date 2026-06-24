import { api } from "../../lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StockLevelItem {
  _id: string;
  quantity: number;
  minThreshold: number;
  productVariant?: { _id: string; sku: string; sizeName: string; price?: number; stockStatus?: string };
  material?: { _id: string; name: string; unit: string; costPerUnit?: number; shelfLifeDays?: number };
  warehouse?: { _id: string; name: string };
}

export interface TransactionItem {
  _id: string;
  type: "IMPORT" | "EXPORT" | "ADJUSTMENT";
  quantity: number;
  reason: string;
  timestamp: string;
  stockLevel?: {
    material?: { name: string; unit: string };
    productVariant?: { sku: string; sizeName: string };
    warehouse?: { name: string };
  };
  performedBy?: { fullName: string; email: string };
}

export interface WarehouseSummary {
  totalSkus: number;
  lowStockCount: number;
  outOfStockCount: number;
  todayImports: number;
  lowStockItems: Array<{ id: string; name: string; unit: string; quantity: number; minThreshold: number; status: string }>;
  recentTransactions: TransactionItem[];
}

export interface ImportStockPayload {
  warehouseId: string;
  variantId?: string;
  materialId?: string;
  quantity: number;
  reason?: string;
}

export interface TransactionsParams {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface MaterialItem {
  _id: string;
  name: string;
  unit: string;
  costPerUnit?: number;
  shelfLifeDays?: number | null;
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export async function fetchWarehouseSummary(): Promise<WarehouseSummary> {
  const res = await api.get("/api/v1/warehouse/summary");
  return res.data.data as WarehouseSummary;
}

export async function fetchStockLevels(type?: "material" | "variant"): Promise<StockLevelItem[]> {
  const res = await api.get("/api/v1/warehouse/stock", { params: { type } });
  return res.data.data as StockLevelItem[];
}

export async function importStock(payload: ImportStockPayload) {
  const res = await api.post("/api/v1/warehouse/import", payload);
  return res.data;
}

export async function fetchTransactions(params: TransactionsParams = {}) {
  const res = await api.get("/api/v1/warehouse/transactions", { params });
  return res.data.data as { items: TransactionItem[]; meta: { total: number; page: number; limit: number; pages: number } };
}

export async function fetchMaterials(): Promise<MaterialItem[]> {
  const res = await api.get("/api/v1/warehouse/materials");
  return res.data.data as MaterialItem[];
}
