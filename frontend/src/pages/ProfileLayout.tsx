import { useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { RoseLineArt } from "@/icons";
import { fetchProfile, UNAUTH, resetProfile } from "@/features/profile/profileSlice";
import { resetAuth } from "@/features/auth/authSlice";
import { resetNotifications } from "@/features/notification/notificationSlice";
import { api } from "@/lib/api";
import { clearAuthSessionFlag } from "@/lib/authSession";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const sideMenu = [
  { label: "Tổng quan", icon: "grid_view", path: "overview" },
  { label: "Đơn hàng của tôi", icon: "shopping_bag", path: "orders" },
  { label: "Sổ địa chỉ", icon: "location_on", path: "addresses" },
  { label: "Yêu thích", icon: "favorite", path: "favorites" },
  { label: "Thông báo", icon: "notifications", path: "notifications" },
] as const;

export function ProfileLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const profile = useAppSelector((s) => s.profile.profile);
  const fetchError = useAppSelector((s) => s.profile.fetchError);
  const unreadCount = useAppSelector((s) => s.notification.unreadCount);

  useEffect(() => {
    void dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (fetchError === UNAUTH) {
      navigate("/login", { replace: true });
    }
  }, [fetchError, navigate]);

  const displayName = profile?.fullName || "Người dùng";
  const displayEmail = profile?.email || "--";
  const membership = profile?.role === "admin" ? "VIP Admin" : "VIP";

  const getAvatarInitial = (name: string) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    const first = words[0].charAt(0);
    const last = words[words.length - 1].charAt(0);
    return (first + last).toUpperCase();
  };
  const avatarInitial = getAvatarInitial(displayName);

  return (
    <section className="mx-auto w-full max-w-[1440px] px-margin-mobile pt-28 pb-16 md:max-w-[1600px] md:px-margin-desktop md:pt-32 lg:pt-36 2xl:max-w-[1760px] 3xl:max-w-[1920px]">
      <div className="grid gap-6 xl:grid-cols-12">
        <aside className="min-w-0 space-y-4 xl:col-span-3">
          <div className="glass-panel relative overflow-hidden rounded-[24px] p-6 text-center shadow-[0_10px_40px_rgba(168,85,247,0.05)]">
            <RoseLineArt className="pointer-events-none absolute -right-1 top-2 h-28 w-24 text-soft-amethyst/25" />
            <div className="relative mx-auto mb-4 size-24 rounded-full border border-white/60 bg-soft-amethyst/60 p-1">
              <div className="flex size-full items-center justify-center rounded-full bg-soft-amethyst/40 text-primary text-2xl font-bold shadow-inner overflow-hidden">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt={displayName} className="h-full w-full object-cover" />
                ) : (
                  avatarInitial
                )}
              </div>
              <button
                type="button"
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border border-white/70 bg-pure-ivory text-dusk-gray transition hover:bg-soft-amethyst/20"
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
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-ui-label text-sm transition ${
                        isActive
                          ? "bg-soft-amethyst/70 text-deep-plum font-bold shadow-sm"
                          : "text-midnight-purple hover:bg-pure-ivory/70"
                      }`
                    }
                  >
                    <MaterialIcon name={item.icon} className="text-[18px]" />
                    <span>{item.label}</span>
                    {item.path === "notifications" && unreadCount > 0 ? (
                      <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-pure-ivory">
                        {unreadCount}
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              ))}
              <li className="pt-2 mt-2 border-t border-white/50">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.post("/api/v1/auth/logout");
                    } catch (err) {
                      console.error("Lỗi khi đăng xuất profile", err);
                    } finally {
                      clearAuthSessionFlag();
                      dispatch(resetAuth());
                      dispatch(resetProfile());
                      dispatch(resetNotifications());
                      navigate("/login");
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left font-ui-label text-sm transition text-error hover:bg-error/10"
                >
                  <MaterialIcon name="logout" className="text-[18px]" />
                  <span>Đăng xuất</span>
                </button>
              </li>
            </ul>
          </div>
        </aside>

        {/* Cột hiển thị nội dung động */}
        <div className="min-w-0 xl:col-span-9">
          <Outlet />
        </div>
      </div>
    </section>
  );
}
