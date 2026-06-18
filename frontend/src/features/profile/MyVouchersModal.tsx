import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { CustomerVoucherDto, formatVoucherDiscount } from "@/features/voucher/voucherApi";

type MyVouchersModalProps = {
  vouchers: CustomerVoucherDto[];
  onClose: () => void;
};

export function MyVouchersModal({ vouchers, onClose }: MyVouchersModalProps) {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setCopiedCode(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-deep-plum/40 backdrop-blur-sm" aria-label="Đóng" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-[24px] border border-white/60 bg-pure-ivory p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-section-title text-2xl text-deep-plum">Mã giảm giá của bạn</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1 text-dusk-gray hover:bg-white/60">
            <MaterialIcon name="close" className="text-[20px]" />
          </button>
        </div>

        {vouchers.length === 0 ? (
          <div className="py-8 text-center">
            <MaterialIcon name="sell" className="mx-auto text-[40px] text-dusk-gray/50" />
            <p className="mt-3 text-sm text-midnight-purple">Bạn chưa có mã giảm giá khả dụng.</p>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate("/products");
              }}
              className="mt-4 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
            >
              Mua sắm ngay
            </button>
          </div>
        ) : (
          <ul className="max-h-[360px] space-y-3 overflow-y-auto">
            {vouchers.map((voucher) => (
              <li key={voucher._id} className="rounded-2xl border border-white/60 bg-white/70 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-deep-plum">{voucher.code}</p>
                    <p className="text-sm text-primary">{formatVoucherDiscount(voucher)}</p>
                    <p className="mt-1 text-xs text-dusk-gray">
                      HSD: {new Date(voucher.validUntil).toLocaleDateString("vi-VN")}
                      {voucher.minOrderAmount > 0
                        ? ` · ĐH tối thiểu ${voucher.minOrderAmount.toLocaleString("vi-VN")}đ`
                        : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCopy(voucher.code)}
                    className="rounded-lg bg-soft-amethyst/50 px-2 py-1 text-xs font-semibold text-primary hover:bg-soft-amethyst/70"
                  >
                    {copiedCode === voucher.code ? "Đã copy" : "Copy"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {vouchers.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/checkout");
            }}
            className="login-gradient-bg mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-pure-ivory"
          >
            Dùng ngay tại Checkout
            <MaterialIcon name="arrow_forward" className="text-[16px]" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
