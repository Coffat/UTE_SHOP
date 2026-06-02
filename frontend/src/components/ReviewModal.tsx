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
  onSuccess: (reward: { points: number; voucherCode: string }) => void;
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
        onSuccess(response.data.data.reward);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-purple/40 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-[28px] border border-white/80 p-6 sm:p-8 shadow-[0_20px_50px_rgba(49,27,146,0.12)] relative overflow-hidden group motion-safe:animate-scale-in">
        
        {/* Ambient background decorative colors */}
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-[#ff758c]/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-crystal-border/60">
          <div>
            <h3 className="font-hero-display text-xl font-bold text-deep-plum">Đánh giá sản phẩm</h3>
            <p className="text-xs text-dusk-gray mt-0.5 truncate max-w-[280px] sm:max-w-[360px] font-medium" title={productName}>
              {productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-dusk-gray hover:text-deep-plum p-1.5 rounded-full hover:bg-soft-amethyst/30 transition active-press"
          >
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Star Rating Selector */}
          <div className="text-center space-y-2">
            <label className="text-xs font-bold text-deep-plum block uppercase tracking-wider">
              Mức độ hài lòng của bạn
            </label>
            <div className="flex justify-center items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform duration-200 hover:scale-120 active:scale-95"
                >
                  <MaterialIcon
                    name={star <= rating ? "star" : "star_border"}
                    className={`text-[36px] ${star <= rating ? "text-[#d97706]" : "text-dusk-gray/40"}`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-primary italic">
              {rating === 5 ? "Tuyệt vời chất lượng 5 sao!" :
               rating === 4 ? "Rất hài lòng!" :
               rating === 3 ? "Bình thường" :
               rating === 2 ? "Chưa thực sự ưng ý" : "Rất thất vọng"}
            </p>
          </div>

          {/* Comment text area */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-deep-plum block uppercase tracking-wider">
              Viết chia sẻ/Cảm nhận
            </label>
            <div className="rounded-xl border border-crystal-border bg-pure-ivory/95 p-3.5 focus-within:ring-2 focus-within:ring-primary/30 transition">
              <textarea
                rows={4}
                required
                placeholder="Bó hoa thiết kế đẹp mắt, hoa tươi lâu và đóng gói rất cẩn thận. Giao hàng đúng giờ!"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-transparent text-sm text-deep-plum outline-none resize-none placeholder-dusk-gray/50"
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-dusk-gray font-medium">
              <span>Đánh giá của bạn sẽ được hiển thị công khai.</span>
              <span>{comment.length}/1000 ký tự</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-600 flex items-center gap-2">
              <MaterialIcon name="error" className="text-rose-500 text-[18px]" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-crystal-border/60">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-full border border-crystal-border text-sm font-semibold text-deep-plum bg-pure-ivory/80 hover:bg-white transition active-press"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="btn-hero-cta-gradient px-7 py-2.5 rounded-full text-sm font-bold shadow-md flex items-center gap-1.5 hover-lift active-press"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-pure-ivory border-t-transparent"></div>
                  Đang gửi...
                </>
              ) : (
                <>
                  <MaterialIcon name="send" className="text-xs" />
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
