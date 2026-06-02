import { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/ToastContext";
import { isAxiosError } from "axios";

interface ReviewModalProps {
  orderId: string;
  productId: string;
  productName: string;
  onClose: () => void;
  onSuccess: (reward: { points: number; voucherCode: string }, review?: { rating: number; comment: string }) => void;
}

export function ReviewModal({ orderId, productId, productName, onClose, onSuccess }: ReviewModalProps) {
  const { showToast } = useToast();
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await api.post(`/api/v1/products/${productId}/reviews`, {
        orderId,
        rating,
        comment: comment.trim(),
      });

      if (response.data.success && response.data.data) {
        showToast("Gửi đánh giá thành công!", "success");
        onSuccess(response.data.data.reward, { rating, comment: comment.trim() });
      } else {
        setError(response.data.message || "Đã xảy ra lỗi khi gửi đánh giá.");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = "Không thể gửi đánh giá. Vui lòng thử lại.";
      if (isAxiosError(err)) {
        const body = err.response?.data as { message?: string };
        errMsg = body?.message || errMsg;
      }
      setError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#4a3b52]/40 backdrop-blur-md animate-fade-in">
      {/* Float Level (L2) Modal */}
      <div className="w-full max-w-lg rounded-[24px] border border-white/60 bg-white/70 backdrop-blur-[40px] p-6 sm:p-8 shadow-[0_10px_40px_rgba(168,85,247,0.05)] relative overflow-hidden group motion-safe:animate-scale-in">
        
        {/* Ambient background decorative colors */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#c084fc]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-[#fbcfe8]/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-start pb-5 border-b border-[#f3e8ff]/50 relative z-10">
          <div>
            <h3 className="font-hero-display text-[32px] font-medium text-[#311b92] leading-[1.2]">Trao gửi chân tình</h3>
            <p className="text-[14px] text-[#7e6e8c] mt-1 truncate max-w-[280px] sm:max-w-[360px] font-medium font-ui" title={productName}>
              Đánh giá {productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#7e6e8c] hover:text-[#311b92] p-2 rounded-full hover:bg-white/40 transition active-press"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-8 relative z-10">
          {/* Star Rating Selector */}
          <div className="text-center space-y-3">
            <label className="text-[14px] font-bold text-[#311b92] block font-ui">
              Mức độ hài lòng của bạn
            </label>
            <div className="flex justify-center items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform duration-200 hover:scale-110 active:scale-95 hover:drop-shadow-[0_0_8px_rgba(192,132,252,0.4)]"
                >
                  <MaterialIcon
                    name="star"
                    filled={star <= rating}
                    className={`text-[42px] transition-colors duration-300 ${star <= rating ? "text-[#c084fc] drop-shadow-sm" : "text-[#7e6e8c]/20"}`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[14px] font-medium text-[#c084fc] italic font-hero-display tracking-wide">
              {rating === 5 ? "Tuyệt vời chất lượng 5 sao!" :
               rating === 4 ? "Rất hài lòng!" :
               rating === 3 ? "Bình thường" :
               rating === 2 ? "Chưa thực sự ưng ý" : "Rất thất vọng"}
            </p>
          </div>

          {/* Comment text area */}
          <div className="space-y-2">
            <label className="text-[14px] font-bold text-[#311b92] block font-ui">
              Cảm nhận của bạn
            </label>
            <div className="rounded-[16px] border border-white/60 bg-white/80 p-4 focus-within:ring-2 focus-within:ring-[#c084fc] transition duration-300 shadow-inner">
              <textarea
                rows={4}
                required
                placeholder="Bó hoa thiết kế đẹp mắt, hoa tươi lâu và đóng gói rất cẩn thận. Giao hàng đúng giờ!"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-transparent text-[17px] text-[#4a3b52] outline-none resize-none placeholder-[#7e6e8c]/50 font-ui leading-[1.6]"
              />
            </div>
            <div className="flex items-center justify-between text-[12px] text-[#7e6e8c] font-medium pt-1 px-1">
              <span>Đánh giá sẽ được hiển thị công khai.</span>
              <span>{comment.length}/1000</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-[16px] bg-[#fbcfe8]/30 border border-[#fbcfe8] p-3.5 text-[14px] text-[#311b92] flex items-center gap-2">
              <MaterialIcon name="error" className="text-[#c084fc] text-[20px]" />
              <span className="font-semibold font-ui">{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#f3e8ff]/50">
            {/* Glass Secondary Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-6 py-2.5 rounded-[16px] border border-white/50 bg-white/40 backdrop-blur-[10px] text-[14px] font-bold text-[#311b92] transition hover:bg-white/60 active-press font-ui"
            >
              Hủy
            </button>
            
            {/* Primary CTA Button */}
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="bg-[#c084fc] hover:bg-[#a855f7] text-[#311b92] px-8 py-2.5 rounded-full text-[14px] font-bold shadow-[0_0_15px_rgba(192,132,252,0.3)] hover:shadow-[0_0_25px_rgba(192,132,252,0.5)] flex items-center gap-2 transition active-press font-ui disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#311b92] border-t-transparent"></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <MaterialIcon name="send" className="text-[16px]" />
                  Gửi đánh giá
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
