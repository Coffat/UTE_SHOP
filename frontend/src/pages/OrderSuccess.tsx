import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { api } from "@/lib/api";
import { formatVND } from "./ProductList";

export function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get(`/api/v1/orders/${orderId}`);
        if (response.data.success) {
          setOrder(response.data.data);
        } else {
          setError(response.data.message || "Không thể lấy thông tin đơn hàng.");
        }
      } catch (err: any) {
        console.error("Fetch order error:", err);
        setError(err.response?.data?.message || "Lỗi tải thông tin đơn hàng.");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-lavender-mist pt-32 pb-20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-dusk-gray font-semibold text-sm">Đang tải chi tiết đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-lavender-mist pt-32 pb-20 flex items-center justify-center">
        <div className="mx-auto max-w-md px-4 text-center">
          <div className="glass-panel p-10 rounded-[32px] shadow-lg text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <MaterialIcon name="warning" className="text-[32px]" />
            </div>
            <h1 className="font-hero-display text-2xl font-bold text-deep-plum">Có lỗi xảy ra</h1>
            <p className="text-midnight-purple/80 text-sm">{error || "Đơn hàng không tồn tại."}</p>
            <Link to="/products" className="btn-hero-cta-gradient px-8 py-3 rounded-full font-bold inline-block">
              Quay Lại Cửa Hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Calculate estimated delivery date: Order creation date + 2 days
  const createdDate = new Date(order.createdAt);
  const estDeliveryDate = new Date(createdDate.setDate(createdDate.getDate() + 2));
  const formattedEstDate = estDeliveryDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-lavender-mist pt-32 pb-20 flex items-center justify-center">
      <div className="mx-auto max-w-2xl px-4 text-center w-full">
        <div className="glass-panel p-8 sm:p-10 rounded-[32px] shadow-[0_15px_50px_rgba(49,27,146,0.08)] relative overflow-hidden text-left bg-white/70">
          <div className="absolute inset-0 bg-dreamy-purple/5 blur-[60px] rounded-full scale-75 -z-10"></div>
          
          {/* Green glowing tick */}
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-[#059669] shadow-[0_0_20px_rgba(5,150,105,0.2)] animate-pulse">
            <MaterialIcon name="check" className="text-[44px]" />
          </div>

          <h1 className="font-hero-display text-3xl font-bold text-deep-plum text-center mb-1">Thanh toán thành công!</h1>
          <p className="text-center text-xs text-dusk-gray mb-6">Mã giao dịch đặt hàng đã được xác nhận</p>

          {/* Details list */}
          <div className="space-y-6">
            
            {/* Box 1: Core details */}
            <div className="bg-white/80 rounded-2xl p-5 border border-crystal-border/40 shadow-sm space-y-3.5 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-crystal-border/40">
                <span className="text-dusk-gray font-semibold">Mã đơn hàng</span>
                <span className="font-black text-primary font-mono text-base tracking-wide">{order.orderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray font-semibold">Người nhận</span>
                <span className="font-bold text-deep-plum">{order.recipient.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray font-semibold">Số điện thoại</span>
                <span className="font-bold text-deep-plum">{order.recipient.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dusk-gray font-semibold">Địa chỉ nhận</span>
                <span className="font-bold text-deep-plum text-right max-w-[320px] leading-relaxed">
                  {order.recipient.deliveryNote || "Không xác định"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-crystal-border/40">
                <span className="text-dusk-gray font-semibold">Số tiền thanh toán</span>
                <span className="font-black text-primary text-lg">{formatVND(Number(order.totalAmount))}</span>
              </div>
            </div>

            {/* Box 2: Estimated delivery schedule */}
            <div className="bg-emerald-50/50 rounded-2xl p-5 border border-emerald-100 flex gap-4 items-start shadow-sm">
              <div className="p-2.5 bg-emerald-100 text-[#059669] rounded-xl">
                <MaterialIcon name="event" className="text-[24px]" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-[#065F46] mb-0.5">Dự kiến giao hàng</h4>
                <p className="text-xs text-[#047857] font-medium leading-relaxed">
                  Đơn hoa của bạn sẽ được hoàn thành tỉ mỉ bởi thợ hoa chuyên nghiệp và bàn giao cho đơn vị vận chuyển trước <strong className="font-semibold">{formattedEstDate}</strong>.
                </p>
              </div>
            </div>

          </div>

          <div className="mt-8 text-center space-y-4">
            <p className="text-dusk-gray text-xs max-w-[450px] mx-auto leading-relaxed">
              Chi tiết hóa đơn và hành trình vận chuyển sẽ sớm được cập nhật qua SMS hoặc thông báo tài khoản của bạn.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 btn-hero-cta-gradient px-8 py-3 rounded-full font-bold tracking-wide transition hover:-translate-y-0.5 shadow-md text-sm"
              >
                <MaterialIcon name="shopping_basket" />
                Tiếp Tục Mua Sắm
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-1.5 bg-white/70 hover:bg-white border border-crystal-border px-8 py-3 rounded-full font-bold text-midnight-purple transition text-sm shadow-sm"
              >
                Quay Về Trang Chủ
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
