import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { api } from "@/lib/api";

interface PaymentStatusResponse {
  orderId: string;
  paymentMethod: string;
  paymentStatus: "UNPAID" | "PENDING" | "PAID" | "FAILED" | "CANCELLED";
  orderStatus: string;
  latestTransaction: {
    transactionRef: string;
    provider: string;
    status: string;
    providerTransactionId: string | null;
    updatedAt: string;
  } | null;
}

const decodeExtraData = (value: string | null): { orderId?: string; transactionRef?: string } => {
  if (!value) return {};
  try {
    const decoded = atob(value);
    return JSON.parse(decoded);
  } catch {
    return {};
  }
};

export function PaymentResult() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PaymentStatusResponse | null>(null);

  const provider = searchParams.get("provider");
  const transactionRefFromProvider = searchParams.get("vnp_TxnRef") || searchParams.get("orderId");
  const decodedExtraData = useMemo(() => decodeExtraData(searchParams.get("extraData")), [searchParams]);
  const orderId = decodedExtraData.orderId || searchParams.get("orderId") || null;
  const transactionRef = decodedExtraData.transactionRef || transactionRefFromProvider || null;

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = orderId
          ? await api.get(`/api/v1/orders/${orderId}/payment-status`)
          : transactionRef
            ? await api.get(`/api/v1/payments/transactions/${transactionRef}/status`)
            : null;

        if (!response) {
          throw new Error("Không tìm thấy thông tin đơn hàng hoặc giao dịch để kiểm tra.");
        }
        setData(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || "Không thể kiểm tra trạng thái thanh toán.");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStatus();
  }, [orderId, transactionRef]);

  const statusView = useMemo(() => {
    if (!data) return { icon: "hourglass_top", title: "Đang kiểm tra thanh toán", color: "text-primary" };
    if (data.paymentStatus === "PAID") {
      return { icon: "check_circle", title: "Thanh toán thành công", color: "text-safe-mint" };
    }
    if (data.paymentStatus === "FAILED" || data.paymentStatus === "CANCELLED") {
      return { icon: "cancel", title: "Thanh toán thất bại", color: "text-rose-600" };
    }
    return { icon: "schedule", title: "Thanh toán đang chờ xác nhận", color: "text-amber-500" };
  }, [data]);

  return (
    <div className="min-h-screen bg-lavender-mist pt-32 pb-20">
      <div className="mx-auto max-w-2xl px-4">
        <div className="glass-panel rounded-[2rem] border-white/70 p-8 sm:p-10 text-center shadow-[0_12px_35px_rgba(49,27,146,0.06)]">
          <div className={`mx-auto mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white ${statusView.color}`}>
            <MaterialIcon name={statusView.icon} className="text-[42px]" />
          </div>
          <h1 className="font-hero-display text-3xl font-bold text-deep-plum">{statusView.title}</h1>

          {loading ? (
            <p className="mt-4 text-dusk-gray">Đang đồng bộ trạng thái từ hệ thống thanh toán...</p>
          ) : error ? (
            <p className="mt-4 text-sm font-medium text-rose-600">{error}</p>
          ) : (
            <div className="mt-6 space-y-2 text-sm text-midnight-purple">
              <p>
                Đơn hàng: <span className="font-semibold text-deep-plum">{data?.orderId}</span>
              </p>
              <p>
                Phương thức: <span className="font-semibold text-deep-plum">{data?.paymentMethod}</span>
              </p>
              <p>
                Trạng thái thanh toán: <span className="font-semibold text-deep-plum">{data?.paymentStatus}</span>
              </p>
              {data?.latestTransaction?.transactionRef ? (
                <p>
                  Mã giao dịch:{" "}
                  <span className="font-semibold text-deep-plum">{data.latestTransaction.transactionRef}</span>
                </p>
              ) : null}
              {provider ? (
                <p>
                  Cổng thanh toán: <span className="font-semibold text-deep-plum">{provider}</span>
                </p>
              ) : null}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to={data?.orderId ? `/order-success/${data.orderId}` : "/user/profile/overview"}
              className="btn-hero-cta-gradient rounded-full px-6 py-3 font-semibold"
            >
              Xem chi tiết đơn hàng
            </Link>
            <Link
              to="/products"
              className="rounded-full border border-crystal-border bg-pure-ivory/70 px-6 py-3 font-semibold text-deep-plum"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
