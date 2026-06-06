import * as XLSX from "xlsx";
import type { AdminOrderRow } from "../services/mappers/order.mapper";

const STATUS_LABELS: Record<AdminOrderRow["status"], string> = {
  pending: "Chờ xử lý",
  confirmed: "Đã xác nhận",
  ready: "Sẵn sàng giao",
  shipping: "Đang giao",
  completed: "Hoàn tất",
  cancelled: "Đã hủy",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  SUCCESS: "Đã thanh toán",
  PENDING: "Chưa thanh toán",
  FAILED: "Thất bại",
  REFUNDED: "Hoàn tiền",
};

const ORDER_TYPE_LABELS: Record<string, string> = {
  ONLINE: "Online",
  AT_STORE: "Tại cửa hàng",
};

export function exportOrdersToExcel(rows: AdminOrderRow[], filename: string): void {
  const sheetData = rows.map((order) => ({
    "Mã đơn": order.orderCode,
    "Khách hàng": order.customerName,
    "SĐT": order.customerPhone,
    "Ngày tạo": order.date,
    "Loại đơn": ORDER_TYPE_LABELS[order.orderType] ?? (order.orderType || "—"),
    "PT thanh toán": order.paymentMethod || "—",
    "Trạng thái TT":
      order.paymentStatus ? PAYMENT_STATUS_LABELS[order.paymentStatus] ?? order.paymentStatus : "—",
    "Tổng tiền": order.amount,
    "Trạng thái đơn": STATUS_LABELS[order.status],
  }));

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Đơn hàng");
  XLSX.writeFile(workbook, filename);
}
