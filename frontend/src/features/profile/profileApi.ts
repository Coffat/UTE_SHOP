import { api } from "@/lib/api";

export type PointLedgerEntry = {
  _id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
};

export async function changeUserPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  const { data } = await api.post<{ success: boolean; message?: string }>(
    "/api/v1/users/change-password",
    payload
  );
  if (!data.success) {
    throw new Error(data.message ?? "Không thể đổi mật khẩu");
  }
}

export async function fetchPointHistory(): Promise<PointLedgerEntry[]> {
  const { data } = await api.get<{ success: boolean; data?: PointLedgerEntry[]; message?: string }>(
    "/api/v1/users/points/history"
  );
  if (!data.success || !data.data) {
    throw new Error(data.message ?? "Không tải được lịch sử điểm");
  }
  return data.data;
}
