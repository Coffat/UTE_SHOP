import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { PointLedgerEntry } from "./profileApi";

type PointHistoryModalProps = {
  entries: PointLedgerEntry[];
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

function formatType(type: string): string {
  switch (type) {
    case "EARNED":
      return "Tích điểm";
    case "SPENT":
      return "Dùng điểm";
    case "REFUNDED":
      return "Hoàn điểm";
    case "ADMIN_ADJUST":
      return "Điều chỉnh";
    default:
      return type;
  }
}

export function PointHistoryModal({ entries, loading, error, onClose }: PointHistoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-deep-plum/40 backdrop-blur-sm" aria-label="Đóng" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-[24px] border border-white/60 bg-pure-ivory p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-section-title text-2xl text-deep-plum">Lịch sử điểm tích lũy</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-dusk-gray hover:bg-white/60">
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="mt-2 text-sm text-dusk-gray">Đang tải...</p>
          </div>
        ) : error ? (
          <p className="rounded-xl border border-error/40 bg-error-container/80 px-4 py-3 text-sm text-on-error-container">{error}</p>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center">
            <MaterialIcon name="redeem" className="mx-auto text-[40px] text-dusk-gray/50" />
            <p className="mt-3 text-sm text-midnight-purple">Chưa có giao dịch điểm nào.</p>
          </div>
        ) : (
          <ul className="max-h-[360px] space-y-2 overflow-y-auto">
            {entries.map((entry) => {
              const isPositive = entry.type === "EARNED" || entry.type === "REFUNDED" || entry.amount > 0;
              return (
                <li key={entry._id} className="flex items-center justify-between rounded-xl border border-white/60 bg-white/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-midnight-purple">{entry.description || formatType(entry.type)}</p>
                    <p className="text-xs text-dusk-gray">
                      {new Date(entry.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${isPositive ? "text-[#2a9d66]" : "text-[#ef4444]"}`}>
                    {isPositive ? "+" : "-"}
                    {entry.amount.toLocaleString("vi-VN")} điểm
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
