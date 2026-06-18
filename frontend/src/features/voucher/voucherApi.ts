import { api } from "@/lib/api";

export type CustomerVoucherDto = {
  _id: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  validUntil: string;
  usageLimit: number | null;
  usedCount: number;
};

type MyVouchersResponse = {
  success: boolean;
  data?: { items: CustomerVoucherDto[]; total: number };
  message?: string;
};

export async function fetchMyVouchers(): Promise<{ items: CustomerVoucherDto[]; total: number }> {
  const { data } = await api.get<MyVouchersResponse>("/api/v1/vouchers/mine");
  if (!data.success || !data.data) {
    throw new Error(data.message ?? "Không tải được mã giảm giá");
  }
  return data.data;
}

export function formatVoucherDiscount(voucher: CustomerVoucherDto): string {
  if (voucher.discountType === "PERCENTAGE") {
    return `Giảm ${voucher.discountValue}%`;
  }
  return `Giảm ${voucher.discountValue.toLocaleString("vi-VN")}đ`;
}
