import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLogo } from "@/components/ui/AppLogo";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { RoseLineArt } from "@/icons";
import {
  clearProfileErrors,
  clearSaveMessage,
  fetchProfile,
  fetchUserOrders,
  UNAUTH,
  updateProfile,
} from "@/features/profile/profileSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { api } from "@/lib/api";

const sideMenu = [
  { label: "Tổng quan", icon: "grid_view", active: true },
  { label: "Đơn hàng của tôi", icon: "shopping_bag", active: false },
  { label: "Sổ địa chỉ", icon: "location_on", active: false },
  { label: "Yêu thích", icon: "favorite", active: false },
  { label: "Thông tin tài khoản", icon: "person", active: false },
  { label: "Phương thức thanh toán", icon: "credit_card", active: false },
  { label: "Thông báo", icon: "notifications", active: false },
  { label: "Đăng xuất", icon: "logout", active: false },
] as const;

const quickActions = [
  { label: "Chỉnh sửa hồ sơ", icon: "edit_square" },
  { label: "Đổi mật khẩu", icon: "lock_reset" },
  { label: "Cài đặt thông báo", icon: "notifications" },
] as const;

function formatJoinDate(dateStr?: string) {
  if (!dateStr) {
    return "--/--/----";
  }
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return "--/--/----";
  }
  return new Intl.DateTimeFormat("vi-VN").format(d);
}

export function UserProfile() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const profile = useAppSelector((s) => s.profile.profile);
  const fetchError = useAppSelector((s) => s.profile.fetchError);
  const saveStatus = useAppSelector((s) => s.profile.saveStatus);
  const saveError = useAppSelector((s) => s.profile.saveError);
  const saveMessage = useAppSelector((s) => s.profile.saveMessage);

  const orders = useAppSelector((s) => s.profile.orders);
  const ordersStatus = useAppSelector((s) => s.profile.ordersStatus);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);

  const fnId = useId();
  const phId = useId();

  useEffect(() => {
    void dispatch(fetchProfile());
    void dispatch(fetchUserOrders());
    
    // Fetch points history
    setPointsLoading(true);
    api.get("/api/v1/users/points/history")
      .then(res => {
        if (res.data.success) {
          setPointsHistory(res.data.data);
        }
      })
      .catch(err => console.error("Failed to fetch points", err))
      .finally(() => setPointsLoading(false));
  }, [dispatch]);

  useEffect(() => {
    if (fetchError === UNAUTH) {
      navigate("/login", { replace: true });
    }
  }, [fetchError, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const saving = saveStatus === "loading";
  const displayName = profile?.fullName || "Người dùng";
  const displayEmail = profile?.email || "--";
  const displayPhone = profile?.phone || "0901 234 567";
  const displayAddress = "Quản lý tại Sổ địa chỉ";
  const joinedDate = formatJoinDate(profile?.createdAt);
  const membership = useMemo(
    () => (profile?.role === "admin" ? "VIP Admin" : "VIP"),
    [profile?.role]
  );

  const totalSpent = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [orders]);

  const dynamicPoints = useMemo(() => {
    return Math.round(totalSpent / 1000).toLocaleString("vi-VN");
  }, [totalSpent]);

  const dynamicStatCards = useMemo(() => [
    { title: "Đơn hàng", value: orders.length.toString(), link: "Xem chi tiết", icon: "shopping_bag", tone: "text-[#8b6bff]" },
    { title: "Sản phẩm yêu thích", value: "18", link: "Xem danh sách", icon: "favorite", tone: "text-[#ef74b8]" },
    { title: "Điểm tích lũy", value: dynamicPoints, link: "Xem chi tiết", icon: "redeem", tone: "text-[#54b398]" },
    { title: "Mã giảm giá", value: "3", link: "Xem mã của tôi", icon: "sell", tone: "text-[#9a7bef]" },
  ], [orders.length, dynamicPoints]);

  const recentOrdersList = useMemo(() => {
    return orders.slice(0, 3).map((o) => {
      const itemsSummary = o.items && o.items.length > 0
        ? o.items.map((item: any) => item.snapshotName).join(", ")
        : "Đơn hàng hoa tươi";
      const orderDate = new Date(o.createdAt).toLocaleDateString("vi-VN");
      const orderPrice = Number(o.totalAmount || 0).toLocaleString("vi-VN") + "đ";

      // 4-state standard matching DB: PENDING, DELIVERING, COMPLETED, CANCELLED
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

  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin-mobile pt-28 pb-16 md:max-w-[1600px] md:px-margin-desktop md:pt-32 lg:pt-36 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
      <div className="grid gap-6 xl:grid-cols-12">
        <aside className="space-y-4 xl:col-span-3">
          <div className="glass-panel relative overflow-hidden rounded-[24px] p-6 text-center shadow-[0_10px_40px_rgba(168,85,247,0.05)]">
            <RoseLineArt className="pointer-events-none absolute -right-1 top-2 h-28 w-24 text-soft-amethyst/25" />
            <div className="relative mx-auto mb-4 size-24 rounded-full border border-white/60 bg-soft-amethyst/60 p-1">
              <div className="flex size-full items-center justify-center rounded-full bg-soft-amethyst/40">
                <AppLogo variant="profile" className="h-[72px] w-[72px]" alt="UTESHOP logo avatar" />
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-white/70 bg-pure-ivory text-dusk-gray"
                aria-label="Đổi ảnh đại diện"
              >
                <MaterialIcon name="edit" className="text-[16px]" />
              </button>
            </div>
            <h2 className="font-section-title text-[34px] leading-tight text-deep-plum">{displayName}</h2>
            <p className="mt-1 text-sm text-dusk-gray">{displayEmail}</p>
            <div className="mx-auto mt-4 inline-flex items-center gap-1 rounded-full bg-soft-amethyst/60 px-3 py-1 text-xs font-semibold text-primary">
              <MaterialIcon name="verified" className="text-[14px]" />
              {membership}
            </div>
          </div>

          <div className="glass-panel rounded-[20px] p-3 shadow-[0_10px_40px_rgba(168,85,247,0.04)]">
            <ul className="space-y-1">
              {sideMenu.map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-ui-label text-sm transition ${
                      item.active
                        ? "bg-soft-amethyst/70 text-deep-plum"
                        : "text-midnight-purple hover:bg-pure-ivory/70"
                    }`}
                  >
                    <MaterialIcon name={item.icon} className="text-[18px]" />
                    <span>{item.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-panel rounded-[20px] p-5 shadow-[0_10px_40px_rgba(168,85,247,0.04)]">
            <p className="flex items-center gap-2 font-ui-label text-sm font-semibold text-deep-plum">
              <MaterialIcon name="workspace_premium" className="text-[18px] text-primary" />
              Thành viên VIP
            </p>
            <p className="mt-2 text-sm leading-6 text-midnight-purple/85">
              Bạn đang được hưởng nhiều ưu đãi đặc biệt
            </p>
            <button
              type="button"
              className="mt-4 inline-flex items-center gap-1 rounded-full bg-pure-ivory/80 px-3 py-1.5 text-xs font-semibold text-primary"
            >
              Xem quyền lợi
              <MaterialIcon name="arrow_forward" className="text-[14px]" />
            </button>
          </div>
        </aside>

        <div className="space-y-4 xl:col-span-9">
          <div className="glass-panel rounded-[24px] p-5 shadow-[0_10px_40px_rgba(168,85,247,0.05)] md:p-6">
            {fetchError && fetchError !== UNAUTH ? (
              <p
                className="mb-4 rounded-xl border border-error/40 bg-error-container/80 px-4 py-2 font-ui-label text-sm text-on-error-container"
                role="alert"
              >
                {fetchError}
              </p>
            ) : null}
            {saveError && saveError !== UNAUTH ? (
              <p
                className="mb-4 rounded-xl border border-error/40 bg-error-container/80 px-4 py-2 font-ui-label text-sm text-on-error-container"
                role="alert"
              >
                {saveError}
              </p>
            ) : null}
            {saveMessage ? (
              <p
                className="mb-4 rounded-xl border border-safe-mint/50 bg-safe-mint/30 px-4 py-2 font-ui-label text-sm text-deep-plum"
                role="status"
              >
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
                    <p className="mt-1 text-sm font-semibold text-deep-plum">{dynamicPoints} điểm</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/60 bg-pure-ivory/55 p-2">
                {quickActions.map((action, idx) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      if (idx === 0) {
                        setEditingProfile((v) => !v);
                      }
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-midnight-purple transition hover:bg-white/60"
                  >
                    <MaterialIcon name={action.icon} className="text-[18px] text-dusk-gray" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            {editingProfile ? (
              <form
                className="mt-5 grid gap-3 rounded-2xl border border-white/60 bg-pure-ivory/55 p-4 md:grid-cols-2"
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
                    className="inline-flex min-h-11 items-center rounded-full bg-dreamy-purple px-6 text-sm font-semibold text-deep-plum transition hover:brightness-105 disabled:opacity-60"
                  >
                    {saving ? "Đang lưu..." : "Lưu hồ sơ"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center rounded-full bg-pure-ivory/85 px-6 text-sm font-medium text-midnight-purple"
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
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dynamicStatCards.map((card) => (
              <article
                key={card.title}
                className="glass-panel rounded-[20px] p-4 shadow-[0_10px_30px_rgba(168,85,247,0.04)]"
              >
                <p className="flex items-center gap-2 text-sm text-dusk-gray">
                  <MaterialIcon name={card.icon} className={`text-[19px] ${card.tone}`} />
                  {card.title}
                </p>
                <p className="mt-2 text-[40px] leading-none font-section-title text-deep-plum">{card.value}</p>
                <button
                  type="button"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                >
                  {card.link}
                  <MaterialIcon name="arrow_forward" className="text-[14px]" />
                </button>
              </article>
            ))}
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <article className="glass-panel rounded-[22px] p-5 shadow-[0_10px_40px_rgba(168,85,247,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-section-title text-[32px] text-deep-plum">Đơn hàng gần đây</h3>
                <button type="button" className="text-sm font-medium text-primary">
                  Xem tất cả
                </button>
              </div>

              {ordersStatus === "loading" ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
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
                  {recentOrdersList.map((order) => (
                    <li
                      key={order.id}
                      className="flex items-center gap-3 rounded-2xl border border-white/60 bg-pure-ivory/65 px-4 py-3"
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
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" className="mt-4 text-sm font-semibold text-primary">
                Xem tất cả đơn hàng
              </button>
            </article>

            {/* Điểm tích lũy */}
            <article className="glass-panel rounded-[22px] p-5 shadow-[0_10px_40px_rgba(168,85,247,0.04)] mt-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-section-title text-[32px] text-deep-plum flex items-center gap-2">
                  <MaterialIcon name="stars" className="text-primary text-[28px]" />
                  Lịch sử điểm tích lũy
                </h3>
              </div>

              {pointsLoading ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : pointsHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="mt-2 text-sm font-medium text-midnight-purple">Chưa có giao dịch điểm nào.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {pointsHistory.slice(0, 5).map((txn) => (
                    <li
                      key={txn._id}
                      className="flex items-center gap-3 rounded-2xl border border-white/60 bg-pure-ivory/65 px-4 py-3"
                    >
                      <div className={`flex size-10 items-center justify-center rounded-xl ${txn.type === 'EARNED' ? 'bg-safe-mint/20 text-[#2a9d66]' : 'bg-rose-500/10 text-rose-500'}`}>
                        <MaterialIcon name={txn.type === 'EARNED' ? 'add_circle' : 'remove_circle'} className="text-[20px]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-midnight-purple">{txn.description}</p>
                        <p className="text-xs text-dusk-gray">{new Date(txn.createdAt).toLocaleDateString("vi-VN")}</p>
                      </div>
                      <p className={`text-sm font-bold ${txn.type === 'EARNED' ? 'text-[#2a9d66]' : 'text-rose-500'}`}>
                        {txn.type === 'EARNED' ? '+' : '-'}{txn.amount}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </article>

            <div className="space-y-4">
              <article className="glass-panel rounded-[22px] p-5 shadow-[0_10px_40px_rgba(168,85,247,0.04)]">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-section-title text-[30px] text-deep-plum">Sổ địa chỉ của tôi</h3>
                  <button type="button" className="text-sm font-medium text-primary">
                    Xem tất cả
                  </button>
                </div>
                <div className="rounded-2xl border border-white/60 bg-pure-ivory/70 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <MaterialIcon name="location_on" className="mt-1 text-[19px] text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-midnight-purple">Nhà riêng</p>
                      <p className="text-sm leading-6 text-dusk-gray">{displayAddress}</p>
                      <p className="text-xs text-dusk-gray">SĐT: {displayPhone}</p>
                    </div>
                    <span className="rounded-full bg-soft-amethyst/60 px-2 py-1 text-xs font-semibold text-primary">
                      Mặc định
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-xl border border-dreamy-purple/30 bg-pure-ivory/70 py-2 text-sm font-medium text-primary"
                >
                  <MaterialIcon name="add" className="text-[16px]" />
                  Thêm địa chỉ mới
                </button>
              </article>

              <article
                className="relative overflow-hidden rounded-[22px] border border-white/60 p-5 min-h-[190px] shadow-[0_10px_40px_rgba(168,85,247,0.06)]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, rgba(233,213,255,0.35), rgba(255,255,255,0.42)), url('/images/uu_dai_danh_rieng.png')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                <h3 className="font-section-title text-[30px] text-deep-plum">Ưu đãi dành riêng cho bạn</h3>
                <p className="mt-2 max-w-[250px] text-sm leading-6 text-midnight-purple/85">
                  Nhận ngay ưu đãi sinh nhật đặc biệt và nhiều phần quà hấp dẫn khác.
                </p>
                <button
                  type="button"
                  className="login-gradient-bg relative mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-pure-ivory"
                >
                  Khám phá ngay
                  <MaterialIcon name="arrow_forward" className="text-[16px]" />
                </button>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
