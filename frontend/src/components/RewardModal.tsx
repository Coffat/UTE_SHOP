import { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useToast } from "@/components/ui/ToastContext";

interface RewardModalProps {
  points: number;
  voucherCode: string;
  onClose: () => void;
}

/**
 * ─── DESIGN DIRECTION SUMMARY ────────────────────────────────────────────────
 * Aesthetic Name: Luxury Botanical / Editorial Minimal
 * DFII Score: 13
 * Key Inspiration: French high-end florist tag designs & botanical portfolios.
 *
 * ─── DIFFERENTIATION CALLOUT ─────────────────────────────────────────────────
 * This avoids generic AI UI patterns by replacing floating emoji confetti and neon 
 * gradient boxes with elegant serif typography (Cormorant Garamond), a hand-drawn 
 * SVG botanical stem outline background, receipt-style minimalist rows, and a fine 
 * border ticket-stub styling for the discount code.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function RewardModal({ points, voucherCode, onClose }: RewardModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(voucherCode);
      setCopied(true);
      showToast("Đã sao chép mã giảm giá thành công!", "success");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error(err);
      showToast("Không thể tự động sao chép mã. Hãy tự bôi đơn mã.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-purple/35 backdrop-blur-sm animate-fade-in">
      
      {/* Main card */}
      <div className="relative w-full max-w-[420px] bg-white border border-dusk-gray/20 rounded-2xl p-8 sm:p-10 shadow-[0_15px_45px_rgba(49,27,146,0.06)] overflow-hidden motion-safe:animate-fade-up">
        
        {/* Hand-drawn SVG botanical line art stem background */}
        <div className="absolute right-0 bottom-0 w-48 h-48 text-[#4a5d4e]/5 select-none pointer-events-none translate-x-6 translate-y-6">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.75" className="w-full h-full">
            <path d="M10,95 Q40,65 75,10" />
            <path d="M75,10 Q60,25 50,20 Q40,15 30,30 Q20,45 25,80" />
            <path d="M50,20 Q45,35 37,32 Q29,29 25,80" />
            <path d="M75,10 C65,0 45,5 40,20 C30,15 20,30 30,40" />
            <path d="M45,65 Q30,60 25,45 Q40,50 45,65" />
            <path d="M55,50 Q70,45 75,30 Q60,35 55,50" />
          </svg>
        </div>

        {/* Minimal Decorative Top Divider */}
        <div className="flex justify-center mb-6">
          <div className="w-1.5 h-1.5 rounded-full bg-[#4a5d4e]/40 mx-1"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#cfa86b]/40 mx-1"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#4a5d4e]/40 mx-1"></div>
        </div>

        {/* Celebratory Title in Serif Italic */}
        <div className="text-center space-y-2 mb-8">
          <h3 className="font-serif text-3xl font-bold italic text-deep-plum tracking-wide">
            Đóng góp tinh tế
          </h3>
          <p className="text-[10px] text-dusk-gray font-bold tracking-widest uppercase font-sans">
            Cảm ơn bạn đã gửi đánh giá sản phẩm
          </p>
        </div>

        {/* Receipt-style Reward details */}
        <div className="space-y-6">
          
          {/* Points received */}
          <div className="flex items-baseline justify-between border-b border-dashed border-dusk-gray/10 pb-4">
            <div className="space-y-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-[#4a5d4e]">
                Loyalty Reward
              </span>
              <p className="text-xs font-semibold text-deep-plum">Điểm tích lũy nhận được</p>
            </div>
            <span className="text-lg font-extrabold text-[#4a5d4e] font-serif">
              +{points} pts
            </span>
          </div>

          {/* Voucher received - styled like a physical botanical gift tag */}
          <div className="border border-dashed border-[#cfa86b]/50 bg-[#f9f5eb]/50 rounded-xl p-5 space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-bold tracking-widest text-[#cfa86b]">
                  Special Gift Voucher
                </span>
                <p className="text-xs font-bold text-deep-plum">
                  Ưu đãi 10% cho đơn hàng sau
                </p>
              </div>
              <span className="text-[10px] text-dusk-gray/60 font-semibold italic">
                30 ngày
              </span>
            </div>

            {/* Monospace Code & Copy Button stub */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-[#cfa86b]/20 px-4 py-3 rounded-lg font-mono font-bold text-deep-plum text-xs text-center tracking-widest shadow-inner select-all">
                {voucherCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="bg-[#cfa86b]/10 hover:bg-[#cfa86b]/20 text-[#cfa86b] border border-[#cfa86b]/25 p-3 rounded-lg transition-all active:scale-95 cursor-pointer flex-shrink-0 flex items-center justify-center"
                title="Sao chép mã giảm giá"
              >
                <MaterialIcon name={copied ? "check" : "content_copy"} className="text-[16px] font-bold" />
              </button>
            </div>
          </div>

        </div>

        {/* Lowercase, clean close button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full mt-8 bg-deep-plum hover:bg-[#4a5d4e] text-white text-xs font-bold uppercase tracking-widest py-3.5 rounded-lg shadow-sm hover-lift active-press transition duration-300 cursor-pointer"
        >
          Hoàn tất
        </button>

      </div>
    </div>
  );
}
