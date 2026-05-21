import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { api } from "@/lib/api";
import { formatVND } from "./ProductList";
import { useDispatch } from "react-redux";
import { clearCart } from "@/features/cart/cartSlice";

export function MockMomoGateway() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const paymentId = searchParams.get("paymentId") || "";
  const amountStr = searchParams.get("amount") || "0";
  const amount = parseFloat(amountStr);

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes countdown
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch payment details to show the order reference
    if (paymentId) {
      api.get(`/api/v1/payments/order/${paymentId}`) // wait, standard get is by order or we can just fetch order directly or keep it simple. Let's see if we can get order details.
        // Actually, we can fetch orderId from payment or just display mock order info.
        // Let's keep it robust and fetch payment data if needed, or simply render with paymentId and amount.
        setError(null);
    }
  }, [paymentId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      navigate("/checkout?error=session_expired");
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handlePaymentSuccess = async () => {
    setLoading(true);
    setError(null);
    try {
      // Execute simulated MoMo IPN Callback
      const response = await api.post("/api/v1/payments/momo-ipn", {
        paymentId,
        status: "SUCCESS",
        transactionId: `MOMO-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        secretToken: "MOMO_INTEGRATION_TOKEN_SECRET",
      });

      if (response.data.success) {
        const paymentRecord = response.data.data;
        // Clear local cart
        dispatch(clearCart());
        // Redirect to Order Success page using the associated order ID
        navigate(`/order-success/${paymentRecord.order}`);
      } else {
        setError(response.data.message || "Thanh toán thất bại");
      }
    } catch (err: any) {
      console.error("IPN Error:", err);
      setError(err.response?.data?.message || "Không thể thực hiện thanh toán. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/checkout?status=cancelled");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center pt-24 pb-12 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_20px_50px_rgba(165,0,100,0.08)] border border-[#E0E0E0] overflow-hidden">
        
        {/* MoMo Header pink bar */}
        <div className="bg-[#A50064] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-[#A50064] text-lg shadow-sm">
              m
            </div>
            <div>
              <h2 className="font-bold text-base leading-none">Cổng Thanh Toán MoMo</h2>
              <span className="text-[10px] text-pink-200">Đối tác tin cậy của UTESHOP</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-pink-200 block uppercase tracking-wider font-semibold">Hết hạn sau</span>
            <span className="font-mono font-bold text-sm tracking-wide bg-white/10 px-2 py-0.5 rounded border border-white/10">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        {/* Payment Summary Box */}
        <div className="p-6 bg-[#FFF2F8] border-b border-[#FDDCEE]">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-[#808080]">Số tiền cần thanh toán:</span>
            <span className="text-2xl font-black text-[#A50064] tracking-tight">{formatVND(amount)}</span>
          </div>
          <div className="mt-4 flex justify-between items-center text-xs font-medium text-[#4D4D4D]">
            <span>Mã giao dịch UTE:</span>
            <span className="font-bold font-mono text-[#000]">{paymentId.substring(0, 8)}...{paymentId.substring(paymentId.length - 8)}</span>
          </div>
        </div>

        {/* Interaction section */}
        <div className="p-6 space-y-6 text-center">
          
          {/* Mock QR scan code wrapper */}
          <div className="relative inline-block p-4 bg-white rounded-2xl border border-dashed border-[#A50064]/30 shadow-inner">
            <div className="w-48 h-48 bg-slate-50 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
              <MaterialIcon name="qr_code_2" className="text-[140px] text-[#A50064] opacity-90" />
              
              {/* Simulated scanning scanline */}
              <div className="absolute left-0 right-0 h-0.5 bg-[#A50064] shadow-[0_0_8px_rgba(165,0,100,0.8)] animate-bounce" style={{ animationDuration: '3s' }}></div>
              
              {/* Center MoMo logo */}
              <div className="absolute inset-0 m-auto w-8 h-8 rounded-lg bg-[#A50064] flex items-center justify-center text-white text-[14px] font-black border-2 border-white shadow-md">
                m
              </div>
            </div>
          </div>

          <p className="text-xs font-medium text-[#666666] max-w-[280px] mx-auto leading-relaxed">
            Mở ứng dụng <strong className="text-[#A50064]">MoMo</strong> trên điện thoại, chọn "Quét Mã" để thực hiện thanh toán ngay.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3 text-left flex items-start gap-2">
              <MaterialIcon name="error" className="text-red-500 text-[16px] flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 space-y-3">
            
            <button
              onClick={handlePaymentSuccess}
              disabled={loading}
              className="w-full py-3.5 bg-[#A50064] hover:bg-[#8D0055] disabled:bg-[#C0C0C0] text-white font-bold rounded-2xl transition shadow-[0_4px_15px_rgba(165,0,100,0.2)] flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Đang xác thực thanh toán...
                </>
              ) : (
                <>
                  <MaterialIcon name="payment" className="text-[18px]" />
                  Simulate Thành công (Thanh toán)
                </>
              )}
            </button>

            <button
              onClick={handleCancel}
              disabled={loading}
              className="w-full py-2.5 bg-white border border-[#E0E0E0] hover:bg-slate-50 text-[#666666] font-semibold text-xs rounded-2xl transition"
            >
              Hủy bỏ giao dịch
            </button>
            
          </div>
          
        </div>

        {/* Footer info branding */}
        <div className="bg-slate-50 px-6 py-4 border-t border-[#F0F0F0] text-center">
          <p className="text-[10px] text-[#999999] leading-relaxed">
            Đây là môi trường giả lập thử nghiệm tích hợp MoMo. Không trừ tiền thật của quý khách dưới mọi hình thức.
          </p>
        </div>

      </div>
    </div>
  );
}
