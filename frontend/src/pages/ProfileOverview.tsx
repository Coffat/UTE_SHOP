import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  clearProfileErrors,
  clearSaveMessage,
  fetchUserOrders,
  UNAUTH,
  updateProfile,
} from "@/features/profile/profileSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useNavigate } from "react-router-dom";
import { fetchWishlist } from "@/features/wishlist/wishlistSlice";
import { AddressDto, fetchAddresses, formatAddressLine } from "@/features/address/addressApi";
import { CustomerVoucherDto, fetchMyVouchers } from "@/features/voucher/voucherApi";
import { ChangePasswordForm } from "@/features/profile/ChangePasswordForm";
import { MyVouchersModal } from "@/features/profile/MyVouchersModal";
import { fetchPointHistory, PointLedgerEntry } from "@/features/profile/profileApi";
import { PointHistoryModal } from "@/features/profile/PointHistoryModal";

const quickActions = [
  { id: "edit", label: "Chỉnh sửa hồ sơ", icon: "edit_square" },
  { id: "password", label: "Đổi mật khẩu", icon: "lock_reset" },
  { id: "notifications", label: "Cài đặt thông báo", icon: "notifications" },
] as const;

const TIER_LABELS: Record<string, string> = {
  BRONZE: "Đồng",
  SILVER: "Bạc",
  GOLD: "Vàng",
  PLATINUM: "Bạch kim",
};

function formatJoinDate(dateStr?: string) {
  if (!dateStr) return "--/--/----";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "--/--/----";
  return new Intl.DateTimeFormat("vi-VN").format(d);
}

function getDisplayPoints(profile: { points?: number; loyalty?: { points: number } } | null): number {
  if (!profile) return 0;
  return profile.points ?? profile.loyalty?.points ?? 0;
}

function getMembershipLabel(profile: { role?: string; loyalty?: { tier: string } } | null): string {
  if (!profile) return "VIP";
  if (profile.role?.toLowerCase() === "admin") return "VIP Admin";
  const tier = profile.loyalty?.tier;
  if (tier && TIER_LABELS[tier]) return TIER_LABELS[tier];
  return "VIP";
}

type StatCardKey = "orders" | "favorites" | "points" | "vouchers";

export function ProfileOverview() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const profile = useAppSelector((s) => s.profile.profile);
  const fetchError = useAppSelector((s) => s.profile.fetchError);
  const saveStatus = useAppSelector((s) => s.profile.saveStatus);
  const saveError = useAppSelector((s) => s.profile.saveError);
  const saveMessage = useAppSelector((s) => s.profile.saveMessage);
  const orders = useAppSelector((s) => s.profile.orders);
  const ordersStatus = useAppSelector((s) => s.profile.ordersStatus);
  const wishlistItems = useAppSelector((s) => s.wishlist.items);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [vouchers, setVouchers] = useState<CustomerVoucherDto[]>([]);
  const [voucherTotal, setVoucherTotal] = useState(0);
  const [showVouchersModal, setShowVouchersModal] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointHistory, setPointHistory] = useState<PointLedgerEntry[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsError, setPointsError] = useState<string | null>(null);

  const fnId = useId();
  const phId = useId();

  useEffect(() => {
    void dispatch(fetchUserOrders());
    void dispatch(fetchWishlist());
    fetchAddresses()
      .then(setAddresses)
      .catch(() => setAddresses([]));
    fetchMyVouchers()
      .then(({ items, total }) => {
        setVouchers(items);
        setVoucherTotal(total);
      })
      .catch(() => {
        setVouchers([]);
        setVoucherTotal(0);
      });
  }, [dispatch]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const openPointHistory = useCallback(async () => {
    setShowPointsModal(true);
    setPointsLoading(true);
    setPointsError(null);
    try {
      const entries = await fetchPointHistory();
      setPointHistory(entries);
    } catch (err) {
      setPointHistory([]);
      setPointsError(err instanceof Error ? err.message : "Không tải được lịch sử điểm");
    } finally {
      setPointsLoading(false);
    }
  }, []);

  const handleStatCardClick = useCallback(
    (key: StatCardKey) => {
      switch (key) {
        case "orders":
          navigate("/user/profile/orders");
          break;
        case "favorites":
          navigate("/user/profile/favorites");
          break;
        case "points":
          void openPointHistory();
          break;
        case "vouchers":
          setShowVouchersModal(true);
          break;
      }
    },
    [navigate, openPointHistory]
  );

  const handleQuickAction = useCallback(
    (id: (typeof quickActions)[number]["id"]) => {
      if (id === "edit") {
        setChangingPassword(false);
        setEditingProfile((v) => !v);
        return;
      }
      if (id === "password") {
        setEditingProfile(false);
        setChangingPassword((v) => !v);
        return;
      }
      navigate("/user/profile/notifications");
    },
    [navigate]
  );

  const saving = saveStatus === "loading";
  const displayName = profile?.fullName || "Người dùng";
  const displayPhone = profile?.phone || "—";
  const joinedDate = formatJoinDate(profile?.createdAt);
  const membership = useMemo(() => getMembershipLabel(profile), [profile]);
  const displayPoints = useMemo(() => getDisplayPoints(profile), [profile]);
  const formattedPoints = displayPoints.toLocaleString("vi-VN");

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    [addresses]
  );

  const dynamicStatCards = useMemo(
    () => [
      {
        key: "orders" as const,
        title: "Đơn hàng",
        value: orders.length.toString(),
        link: "Xem chi tiết",
        icon: "shopping_bag",
        tone: "text-[#8b6bff]",
      },
      {
        key: "favorites" as const,
        title: "Sản phẩm yêu thích",
        value: wishlistItems.length.toString(),
        link: "Xem danh sách",
        icon: "favorite",
        tone: "text-[#ef74b8]",
      },
      {
        key: "points" as const,
        title: "Điểm tích lũy",
        value: formattedPoints,
        link: "Xem chi tiết",
        icon: "redeem",
        tone: "text-[#54b398]",
      },
      {
        key: "vouchers" as const,
        title: "Mã giảm giá",
        value: voucherTotal.toString(),
        link: "Xem mã của tôi",
        icon: "sell",
        tone: "text-[#9a7bef]",
      },
    ],
    [orders.length, wishlistItems.length, formattedPoints, voucherTotal]
  );

  const recentOrdersList = useMemo(() => {
    return orders.slice(0, 3).map((o) => {
      const itemsSummary =
        o.items && o.items.length > 0
          ? o.items.map((item) => item.snapshotName).join(", ")
          : "Đơn hàng hoa tươi";
      const orderDate = new Date(o.createdAt).toLocaleDateString("vi-VN");
      const orderPrice = Number(o.totalAmount || 0).toLocaleString("vi-VN") + "đ";

      let dbStatus = o.status || "PENDING";
      if (dbStatus === "CONFIRMED" || dbStatus === "READY") {
        dbStatus = "PENDING";
      }

      return {
        id: o._id,
        name: itemsSummary,
        date: orderDate,
        status: dbStatus,
        price: orderPrice,
      };
    });
  }, [orders]);

  const goToOrders = useCallback(
    (openOrderId?: string) => {
      navigate("/user/profile/orders", openOrderId ? { state: { openOrderId } } : undefined);
    },
    [navigate]
  );

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-[24px] p-5 shadow-[0_10px_40px_rgba(168,85,247,0.05)] md:p-6">
        {fetchError && fetchError !== UNAUTH ? (
          <p className="mb-4 rounded-xl border border-error/40 bg-error-container/80 px-4 py-2 font-ui-label text-sm text-on-error-container" role="alert">
            {fetchError}
          </p>
        ) : null}
        {saveError && saveError !== UNAUTH ? (
          <p className="mb-4 rounded-xl border border-error/40 bg-error-container/80 px-4 py-2 font-ui-label text-sm text-on-error-container" role="alert">
            {saveError}
          </p>
        ) : null}
        {saveMessage ? (
          <p className="mb-4 rounded-xl border border-safe-mint/50 bg-safe-mint/30 px-4 py-2 font-ui-label text-sm text-deep-plum" role="status">
            {saveMessage}
          </p>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <div>
            <p className="font-ui-label text-sm text-dusk-gray">Chào mừng trở lại,</p>
            <h1 className="mt-1 flex items-center gap-2 font-section-title text-[44px] leading-tight text-deep-plum">
              {displayName}
              <MaterialIcon name="verified" className="text-[22px] text-primary" />
            </h1>
            <p className="mt-1 italic text-midnight-purple/75">"Mỗi bó hoa là một lời nhắn gửi yêu thương."</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-pure-ivory/60 px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-medium text-dusk-gray">
                  <MaterialIcon name="calendar_month" className="text-[16px]" />
                  Tham gia từ
                </p>
                <p className="mt-1 text-sm font-semibold text-deep-plum">{joinedDate}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-pure-ivory/60 px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-medium text-dusk-gray">
                  <MaterialIcon name="sell" className="text-[16px]" />
                  Hạng thành viên
                </p>
                <p className="mt-1 text-sm font-semibold text-deep-plum">{membership}</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-pure-ivory/60 px-4 py-3">
                <p className="flex items-center gap-2 text-xs font-medium text-dusk-gray">
                  <MaterialIcon name="card_giftcard" className="text-[16px]" />
                  Điểm tích lũy
                </p>
                <p className="mt-1 text-sm font-semibold text-deep-plum">{formattedPoints} điểm</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/60 bg-pure-ivory/55 p-2">
            {quickActions
              .filter((action) => !(action.id === "password" && (profile?.googleId || profile?.facebookId)))
              .map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition hover:bg-white/60 ${
                    (action.id === "edit" && editingProfile) || (action.id === "password" && changingPassword)
                      ? "bg-soft-amethyst/50 text-deep-plum font-semibold"
                      : "text-midnight-purple"
                  }`}
                >
                  <MaterialIcon name={action.icon} className="text-[18px] text-dusk-gray" />
                  {action.label}
                </button>
              ))}
          </div>
        </div>

        {editingProfile && (
          <form
            className="mt-5 grid gap-3 rounded-2xl border border-white/60 bg-pure-ivory/55 p-4 md:grid-cols-2 shadow-sm"
            onSubmit={async (e) => {
              e.preventDefault();
              dispatch(clearSaveMessage());
              const result = await dispatch(
                updateProfile({
                  fullName: fullName.trim(),
                  phone: phone.trim(),
                })
              );
              if (updateProfile.rejected.match(result) && result.payload === UNAUTH) {
                navigate("/login", { replace: true });
                return;
              }
              if (updateProfile.fulfilled.match(result)) {
                setEditingProfile(false);
              }
            }}
          >
            <div>
              <label htmlFor={fnId} className="mb-1 block text-xs font-medium text-dusk-gray">
                Họ và tên
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/40">
                <MaterialIcon name="badge" className="text-[18px] text-dusk-gray" />
                <input
                  id={fnId}
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    dispatch(clearProfileErrors());
                    dispatch(clearSaveMessage());
                  }}
                  className="w-full bg-transparent text-sm text-deep-plum outline-none"
                />
              </div>
            </div>
            <div>
              <label htmlFor={phId} className="mb-1 block text-xs font-medium text-dusk-gray">
                Số điện thoại
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/40">
                <MaterialIcon name="call" className="text-[18px] text-dusk-gray" />
                <input
                  id={phId}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    dispatch(clearProfileErrors());
                    dispatch(clearSaveMessage());
                  }}
                  className="w-full bg-transparent text-sm text-deep-plum outline-none"
                />
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 items-center rounded-full bg-dreamy-purple px-6 text-sm font-semibold text-deep-plum transition hover:brightness-105 disabled:opacity-60 shadow-sm"
              >
                {saving ? "Đang lưu..." : "Lưu hồ sơ"}
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center rounded-full bg-pure-ivory/85 px-6 text-sm font-medium text-midnight-purple hover:bg-white transition"
                onClick={() => {
                  setEditingProfile(false);
                  if (profile) {
                    setFullName(profile.fullName ?? "");
                    setPhone(profile.phone ?? "");
                  }
                }}
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {changingPassword && (
          <ChangePasswordForm
            onCancel={() => setChangingPassword(false)}
            onSuccess={() => setChangingPassword(false)}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dynamicStatCards.map((card) => (
          <article
            key={card.key}
            role="button"
            tabIndex={0}
            onClick={() => handleStatCardClick(card.key)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleStatCardClick(card.key);
              }
            }}
            className="glass-panel cursor-pointer rounded-[20px] p-4 shadow-[0_10px_30px_rgba(168,85,247,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_36px_rgba(168,85,247,0.08)]"
          >
            <p className="flex items-center gap-2 text-sm text-dusk-gray">
              <MaterialIcon name={card.icon} className={`text-[19px] ${card.tone}`} />
              {card.title}
            </p>
            <p className="mt-2 text-[40px] leading-none font-section-title text-deep-plum">{card.value}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              {card.link}
              <MaterialIcon name="arrow_forward" className="text-[14px]" />
            </span>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <article className="glass-panel rounded-[22px] p-5 shadow-[0_10px_40px_rgba(168,85,247,0.04)]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-section-title text-[32px] text-deep-plum">Đơn hàng gần đây</h3>
            <button
              type="button"
              onClick={() => goToOrders()}
              className="text-sm font-medium text-primary hover:text-deep-plum transition"
            >
              Xem tất cả
            </button>
          </div>

          {ordersStatus === "loading" ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="mt-2 text-sm text-dusk-gray">Đang tải đơn hàng...</p>
            </div>
          ) : recentOrdersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-pure-ivory border border-white/60 text-dusk-gray/50 shadow-inner">
                <MaterialIcon name="local_mall" className="text-[28px]" />
              </div>
              <p className="mt-3 text-sm font-medium text-midnight-purple">Bạn chưa có đơn hàng nào</p>
              <p className="text-xs text-dusk-gray mt-1 max-w-[200px]">Hãy chọn những bó hoa tươi thắm nhất gửi tặng người thương nhé!</p>
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="mt-4 rounded-xl bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
              >
                Mua sắm ngay
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {recentOrdersList.map((order, index) => (
                <li key={order.id || `${order.date}-${index}`}>
                  <button
                    type="button"
                    onClick={() => goToOrders(order.id)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-white/60 bg-pure-ivory/65 px-4 py-3 text-left hover:bg-white transition-colors"
                  >
                    <div className="flex size-10 items-center justify-center rounded-xl bg-soft-amethyst/60 text-primary">
                      <MaterialIcon name="inventory_2" className="text-[20px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-midnight-purple">{order.name}</p>
                      <p className="text-xs text-dusk-gray">{order.date}</p>
                    </div>
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        order.status === "COMPLETED"
                          ? "text-[#2a9d66] bg-[#2a9d66]/10"
                          : order.status === "DELIVERING"
                          ? "text-[#8b6bff] bg-[#8b6bff]/10"
                          : order.status === "CANCELLED"
                          ? "text-[#ef4444] bg-[#ef4444]/10"
                          : "text-[#d97706] bg-[#d97706]/10"
                      }`}
                    >
                      {order.status}
                    </span>
                    <p className="text-sm font-semibold text-deep-plum">{order.price}</p>
                    <MaterialIcon name="chevron_right" className="text-[18px] text-dusk-gray" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => goToOrders()}
            className="mt-4 text-sm font-semibold text-primary hover:text-deep-plum transition"
          >
            Xem tất cả đơn hàng
          </button>
        </article>

        <div className="space-y-4">
          <article className="glass-panel rounded-[22px] p-5 shadow-[0_10px_40px_rgba(168,85,247,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-section-title text-[30px] text-deep-plum">Sổ địa chỉ</h3>
              <button
                type="button"
                onClick={() => navigate("/user/profile/addresses")}
                className="text-sm font-medium text-primary hover:text-deep-plum transition"
              >
                Xem tất cả
              </button>
            </div>
            {defaultAddress ? (
              <div className="rounded-2xl border border-white/60 bg-pure-ivory/70 px-4 py-3">
                <div className="flex items-start gap-3">
                  <MaterialIcon name="location_on" className="mt-1 text-[19px] text-primary" />
                  <div className="flex-1">
                    <p className="font-semibold text-midnight-purple">{defaultAddress.label || "Địa chỉ"}</p>
                    <p className="text-sm leading-6 text-dusk-gray">{formatAddressLine(defaultAddress)}</p>
                    <p className="text-xs text-dusk-gray">SĐT: {displayPhone}</p>
                  </div>
                  {defaultAddress.isDefault ? (
                    <span className="rounded-full bg-soft-amethyst/60 px-2 py-1 text-xs font-semibold text-primary">
                      Mặc định
                    </span>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/60 bg-pure-ivory/50 px-4 py-6 text-center">
                <MaterialIcon name="location_off" className="mx-auto text-[28px] text-dusk-gray/50" />
                <p className="mt-2 text-sm text-midnight-purple">Chưa có địa chỉ giao hàng</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => navigate("/user/profile/addresses", { state: { openCreate: true } })}
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-dreamy-purple/30 bg-pure-ivory/70 py-2 text-sm font-medium text-primary hover:bg-white transition"
            >
              <MaterialIcon name="add" className="text-[16px]" />
              Thêm địa chỉ mới
            </button>
          </article>

          <article
            role="button"
            tabIndex={0}
            onClick={() => {
              if (voucherTotal > 0) {
                setShowVouchersModal(true);
              } else {
                navigate("/products");
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (voucherTotal > 0) setShowVouchersModal(true);
                else navigate("/products");
              }
            }}
            className="relative overflow-hidden rounded-[22px] border border-white/60 p-5 min-h-[190px] shadow-[0_10px_40px_rgba(168,85,247,0.06)] group cursor-pointer"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(233,213,255,0.35), rgba(255,255,255,0.42)), url('/images/uu_dai_danh_rieng.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            <h3 className="font-section-title text-[30px] text-deep-plum">Ưu đãi cho bạn</h3>
            <p className="mt-2 max-w-[250px] text-sm leading-6 text-midnight-purple/85">
              {voucherTotal > 0
                ? `Bạn có ${voucherTotal} mã giảm giá đang khả dụng.`
                : "Nhận ưu đãi sinh nhật đặc biệt và quà tặng hấp dẫn."}
            </p>
            <span className="login-gradient-bg relative mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-pure-ivory shadow-md transition-transform group-hover:-translate-y-0.5">
              Khám phá ngay
              <MaterialIcon name="arrow_forward" className="text-[16px]" />
            </span>
          </article>
        </div>
      </div>

      {showVouchersModal ? (
        <MyVouchersModal vouchers={vouchers} onClose={() => setShowVouchersModal(false)} />
      ) : null}

      {showPointsModal ? (
        <PointHistoryModal
          entries={pointHistory}
          loading={pointsLoading}
          error={pointsError}
          onClose={() => setShowPointsModal(false)}
        />
      ) : null}
    </div>
  );
}
