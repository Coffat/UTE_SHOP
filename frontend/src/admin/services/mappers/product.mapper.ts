/** Must match backend ProductStatus */
export type BackendProductStatus = "DRAFT" | "ACTIVE" | "DISCONTINUED";

export type UiProductStatus = "active" | "inactive";

export interface BackendAdminProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  categoryName: string;
  sku: string;
  price: number;
  stock: number;
  status: BackendProductStatus;
  soldCount: number;
  mainImageUrl: string;
  primaryVariantId: string | null;
}

export interface AdminProductRow {
  id: string;
  name: string;
  description: string;
  sku: string;
  category: string;
  categoryId: string;
  price: number;
  stock: number;
  status: UiProductStatus;
  backendStatus: BackendProductStatus;
  sales: number;
  mainImageUrl: string;
  primaryVariantId: string | null;
  iconType: "headphones" | "sneaker" | "backpack" | "hoodie" | "keyboard" | "mouse" | "earbuds" | "default";
}

export const uiStatusToBackend = (ui: UiProductStatus): BackendProductStatus =>
  ui === "active" ? "ACTIVE" : "DRAFT";

export const mapBackendProductToRow = (item: BackendAdminProduct): AdminProductRow => {
  let uiStatus: UiProductStatus = "inactive";
  if (item.status === "ACTIVE" && item.stock > 0) {
    uiStatus = "active";
  } else if (item.status === "DISCONTINUED" || item.status === "DRAFT") {
    uiStatus = "inactive";
  } else if (item.status === "ACTIVE" && item.stock === 0) {
    uiStatus = "inactive";
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description || "—",
    sku: item.sku || "—",
    category: item.categoryName,
    categoryId: item.categoryId,
    price: item.price,
    stock: item.stock,
    status: uiStatus,
    backendStatus: item.status,
    sales: item.soldCount,
    mainImageUrl: item.mainImageUrl ?? "",
    primaryVariantId: item.primaryVariantId,
    iconType: "default",
  };
};
