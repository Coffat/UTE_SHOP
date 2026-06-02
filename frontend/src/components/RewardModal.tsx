import { useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useToast } from "@/components/ui/ToastContext";

interface RewardModalProps {
  points: number;
  voucherCode: string;
  onClose: () => void;
}

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
      showToast("Không thể tự động sao chép mã. Hãy tự bôi đen mã.", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-midnight-purple/50 backdrop-blur-md animate-fade-in">
      
      {/* Confetti Emoji Falling Visual Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
        <span className="absolute text-4xl animate-bounce" style={{ left: "10%", top: "15%", animationDuration: "3s" }}>🎉</span>
        <span className="absolute text-4xl animate-bounce" style={{ right: "12%", top: "25%", animationDuration: "4s" }}>🌸</span>
        <span className="absolute text-3xl animate-bounce" style={{ left: "20%", bottom: "30%", animationDuration: "3.5s" }}>✨</span>
        <span className="absolute text-3xl animate-bounce" style={{ right: "25%", bottom: "15%", animationDuration: "2.8s" }}>💖</span>
        <span className="absolute text-4xl animate-bounce" style={{ left: "45%", top: "5%", animationDuration: "4.5s" }}>🎈</span>
      </div>

      <div className="glass-panel w-full max-w-md rounded-[32px] border border-white/90 p-8 shadow-[0_25px_60px_rgba(139,107,255,0.18)] text-center relative overflow-hidden group motion-safe:animate-scale-in">
        
        {/* Dynamic Glowing background circles */}
        <div className="absolute -right-20 -top-20 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-48 h-48 bg-[#ff758c]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Celebratory Icon */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-soft-amethyst/30 to-[#ff758c]/30 text-primary shadow-inner relative">
          <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-[#ff758c]/30 opacity-75"></span>
          <MaterialIcon name="celebration" className="text-[52px] text-deep-plum animate-pulse" />
        </div>

        {/* Content Details */}
        <h3 className="font-hero-display text-3xl font-extrabold text-gradient mb-2 tracking-tight">Đánh Giá Thành Công!</h3>
        <p className="text-sm font-semibold text-deep-plum">Cảm ơn bạn đã chia sẻ đánh giá quý báu về sản phẩm.</p>
        
        {/* Rewards Section */}
        <div className="mt-6 space-y-4">
          
          {/* Points Reward Box */}
          <div className="rounded-2xl border border-white/60 bg-pure-ivory/80 px-4 py-3.5 flex items-center justify-between shadow-sm relative overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-[#54b398]"></div>
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-[#54b398]/10 flex items-center justify-center text-[#54b398]">
                <MaterialIcon name="stars" className="text-[20px]" />
              </div>
              <span className="text-xs font-bold text-dusk-gray">Điểm tích lũy nhận được</span>
            </div>
            <span className="text-lg font-extrabold text-[#54b398]">+{points} điểm</span>
          </div>

          {/* Voucher Reward Box */}
          <div className="rounded-2xl border border-white/60 bg-pure-ivory/80 p-4 shadow-sm relative overflow-hidden flex flex-col gap-3">
            <div className="absolute inset-y-0 left-0 w-1.5 bg-primary"></div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MaterialIcon name="sell" className="text-[20px]" />
                </div>
                <span className="text-xs font-bold text-dusk-gray text-left">
                  Mã giảm giá cá nhân 10%<br />
                  <span className="text-[10px] text-dusk-gray/70 font-medium">Hạn dùng 30 ngày • 1 lần dùng</span>
                </span>
              </div>
            </div>

            {/* Copyable Voucher Code Area */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-soft-amethyst/30 border border-crystal-border/80 px-4 py-3 rounded-xl font-mono font-bold text-deep-plum text-sm text-center tracking-wider shadow-inner select-all">
                {voucherCode}
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="bg-deep-plum hover:bg-primary text-pure-ivory p-3 rounded-xl transition-[background-color,transform] active:scale-95 shadow-sm active-press cursor-pointer flex-shrink-0 flex items-center justify-center"
                title="Sao chép mã giảm giá"
              >
                <MaterialIcon name={copied ? "assignment_turned_in" : "content_copy"} className="text-[18px]" />
              </button>
            </div>
          </div>

        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full btn-hero-cta-gradient py-3.5 rounded-full font-bold tracking-wide mt-8 shadow-md hover-lift active-press text-sm"
        >
          Tuyệt vời, cảm ơn!
        </button>

      </div>
    </div>
  );
}
