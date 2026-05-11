import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import {
  clearProfileErrors,
  clearSaveMessage,
  fetchProfile,
  UNAUTH,
  updateProfile,
} from "@/features/profile/profileSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

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

const statCards = [
  { title: "Đơn hàng", value: "24", link: "Xem chi tiết", icon: "shopping_bag", tone: "text-[#8b6bff]" },
  { title: "Sản phẩm yêu thích", value: "18", link: "Xem danh sách", icon: "favorite", tone: "text-[#ef74b8]" },
  { title: "Điểm tích lũy", value: "1.250", link: "Xem chi tiết", icon: "redeem", tone: "text-[#54b398]" },
  { title: "Mã giảm giá", value: "3", link: "Xem mã của tôi", icon: "sell", tone: "text-[#9a7bef]" },
] as const;

const recentOrders = [
  { name: "Lavender Dream", date: "12/05/2025", status: "Đã giao", price: "650.000đ" },
  { name: "Sweet Pink Roses", date: "28/04/2025", status: "Đã giao", price: "750.000đ" },
  { name: "Pure White Lily", date: "15/04/2025", status: "Đã hủy", price: "480.000đ" },
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

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);

  const fnId = useId();
  const phId = useId();
  const addrId = useId();

  useEffect(() => {
    void dispatch(fetchProfile());
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
      setAddress(profile.address ?? "");
    }
  }, [profile]);

  const saving = saveStatus === "loading";
  const displayName = profile?.fullName || "Người dùng";
  const displayEmail = profile?.email || "--";
  const displayPhone = profile?.phone || "0901 234 567";
  const displayAddress = profile?.address || "Quận 3, TP. Hồ Chí Minh";
  const joinedDate = formatJoinDate(profile?.createdAt);
  const membership = useMemo(
    () => (profile?.role === "admin" ? "VIP Admin" : "VIP"),
    [profile?.role]
  );

  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin-mobile pt-28 pb-16 md:max-w-[1600px] md:px-margin-desktop md:pt-32 lg:pt-36 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
      <div className="grid gap-6 xl:grid-cols-12">
        <aside className="space-y-4 xl:col-span-3">
          <div className="glass-panel rounded-[24px] p-6 text-center shadow-[0_10px_40px_rgba(168,85,247,0.05)]">
            <div className="relative mx-auto mb-4 size-24 rounded-full border border-white/60 bg-soft-amethyst/60 p-1">
              <div className="flex size-full items-center justify-center rounded-full bg-soft-amethyst text-[38px] font-section-title text-pure-ivory">
                {displayName.trim().charAt(0).toUpperCase() || "U"}
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
                    <p className="mt-1 text-sm font-semibold text-deep-plum">1.250 điểm</p>
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
                      address: address.trim(),
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
                <div className="md:col-span-2">
                  <label htmlFor={addrId} className="mb-1 block text-xs font-medium text-dusk-gray">
                    Địa chỉ
                  </label>
                  <textarea
                    id={addrId}
                    rows={2}
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      dispatch(clearProfileErrors());
                      dispatch(clearSaveMessage());
                    }}
                    className="w-full rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 py-2.5 text-sm text-deep-plum outline-none focus:ring-2 focus:ring-primary/40"
                  />
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
                        setAddress(profile.address ?? "");
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
            {statCards.map((card) => (
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
              <ul className="space-y-3">
                {recentOrders.map((order) => (
                  <li
                    key={order.name}
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
                      className={`text-xs font-semibold ${
                        order.status === "Đã giao" ? "text-[#2a9d66]" : "text-dusk-gray"
                      }`}
                    >
                      {order.status}
                    </span>
                    <p className="text-sm font-semibold text-deep-plum">{order.price}</p>
                    <MaterialIcon name="chevron_right" className="text-[18px] text-dusk-gray" />
                  </li>
                ))}
              </ul>
              <button type="button" className="mt-4 text-sm font-semibold text-primary">
                Xem tất cả đơn hàng
              </button>
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
