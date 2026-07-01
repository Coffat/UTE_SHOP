import { useEffect, useId, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { AppLogo } from "@/components/ui/AppLogo";
import { api } from "@/lib/api";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchProfile, resetProfile } from "@/features/profile/profileSlice";
import { fetchWishlist } from "@/features/wishlist/wishlistSlice";
import { fetchCategories } from "@/features/catalog/categoriesSlice";
import { resetAuth } from "@/features/auth/authSlice";
import { fetchNotifications, fetchUnreadCount, markAsRead, resetNotifications } from "@/features/notification/notificationSlice";
import { subscribeNotificationRealtime } from "@/features/notification/notificationRealtime";
import { getDashboardBasePath } from "@/features/notification/notificationRouting";
import { clearAuthSessionFlag, hasAuthSessionFlag } from "@/lib/authSession";
import { getAvatarInitial, getDisplayName, isStorefrontCustomer } from "@/lib/userDisplay";

const NAV_LINKS = [
  { label: "Trang chủ", href: "/" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Danh mục", href: "/categories", isDropdown: true },
  { label: "Blog", href: "/blogs" },
  { label: "Hỗ trợ", href: "/support" },
];

function navLinkClassName(active: boolean) {
  const base =
    "font-home-heading rounded-2xl px-4 py-2.5 text-sm font-medium text-midnight-purple transition-colors hover:bg-soft-amethyst/40 hover:text-primary lg:px-0 lg:py-0 lg:hover:bg-transparent";
  const desktopActive =
    "lg:border-b-2 lg:border-primary lg:rounded-none lg:pb-0.5 lg:text-primary";
  return [base, active ? desktopActive : ""].filter(Boolean).join(" ");
}

export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const navId = useId();
  const sheetId = `${navId}-sheet`;

  const dispatch = useDispatch<AppDispatch>();
  const { profile, fetchStatus } = useSelector((state: RootState) => state.profile);
  const { items: wishlistItems, status: wishlistStatus } = useSelector((state: RootState) => state.wishlist);
  const categories = useSelector((state: RootState) => state.categories?.items || []);
  const { items: notificationItems, unreadCount } = useSelector((state: RootState) => state.notification);
  const notifications = Array.isArray(notificationItems) ? notificationItems : [];

  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (profile) {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    }
  }, [profile, dispatch]);

  useEffect(() => {
    if (!profile) return;
    return subscribeNotificationRealtime(dispatch);
  }, [profile, dispatch]);

  useEffect(() => {
    const handleUpdate = () => {
      dispatch(fetchNotifications());
      dispatch(fetchUnreadCount());
    };
    window.addEventListener("notification-updated", handleUpdate);
    return () => {
      window.removeEventListener("notification-updated", handleUpdate);
    };
  }, [dispatch]);

  // Tải danh mục hoa từ database khi khởi chạy
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // Chỉ gọi profile khi có session flag (cookie HttpOnly là nguồn xác thực thật)
  useEffect(() => {
    if (
      hasAuthSessionFlag() &&
      (fetchStatus === "idle" || fetchStatus === "failed")
    ) {
      dispatch(fetchProfile());
    }
  }, [dispatch, fetchStatus]);

  const isLoggedIn = fetchStatus === "succeeded" && profile != null;
  const showProfileLoading = hasAuthSessionFlag() && fetchStatus === "loading";
  const displayName = profile ? getDisplayName(profile) : "User";
  const avatarInitial = getAvatarInitial(displayName);

  // Wishlist API chỉ cho CUSTOMER — admin/staff gọi sẽ 403 và trước đây làm mất session
  useEffect(() => {
    if (profile && isStorefrontCustomer(profile.role) && wishlistStatus === "idle") {
      dispatch(fetchWishlist());
    }
  }, [dispatch, profile, wishlistStatus]);

  // Lấy tổng số lượng sản phẩm từ giỏ hàng trong Redux
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // Đóng user menu khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Đóng các menu khi chuyển trang
  useEffect(() => {
    setIsUserMenuOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-4 left-1/2 z-50 w-[calc(100%-32px)] max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] -translate-x-1/2 md:top-6">
      <div className="glass-panel relative z-[70] flex items-center justify-between gap-3 rounded-full px-4 py-2.5 shadow-sm md:gap-4 md:px-5 md:py-3 lg:px-6">
        <Link to="/" aria-label="UTESHOP trang chủ" className="flex shrink-0 items-center">
          <AppLogo variant="header" withText textClassName="text-base md:text-lg font-home-heading font-bold tracking-wide text-deep-plum" />
        </Link>

        <nav
          id={navId}
          aria-label="Chính"
          className="absolute left-1/2 top-full z-40 mt-3 hidden w-[min(92vw,720px)] -translate-x-1/2 flex-col gap-1 rounded-3xl border border-crystal-border bg-pure-ivory/95 p-3 shadow-lg backdrop-blur-xl lg:static lg:z-auto lg:mt-0 lg:flex lg:w-auto lg:max-w-none lg:translate-x-0 lg:flex-1 lg:flex-row lg:items-center lg:justify-center lg:gap-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none xl:gap-8"
        >
          {NAV_LINKS.map((item) => {
            if ('isDropdown' in item && item.isDropdown) {
              const active = pathname === "/categories" || pathname.startsWith("/category/");
              return (
                <div
                  key={item.label}
                  className="relative py-2 lg:py-0"
                  onMouseEnter={() => setIsDropdownOpen(true)}
                  onMouseLeave={() => setIsDropdownOpen(false)}
                >
                  <Link
                    to={item.href}
                    className={`${navLinkClassName(active)} flex items-center gap-1`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{item.label}</span>
                    <MaterialIcon
                      name="expand_more"
                      className={`text-[16px] transition-transform duration-350 ${isDropdownOpen ? "rotate-180 text-primary" : ""}`}
                    />
                  </Link>

                  {/* Glassmorphic Dropdown Panel */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-3.5 w-[560px] rounded-3xl glass-panel border border-crystal-border bg-pure-ivory/98 p-5 shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-300 z-[100] ${
                      isDropdownOpen
                        ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
                        : "pointer-events-none opacity-0 translate-y-2 scale-95"
                    }`}
                  >
                    <div className="mb-4 flex items-center justify-between border-b border-crystal-border pb-2.5">
                      <span className="font-home-heading text-[11px] font-bold uppercase tracking-wider text-deep-plum">
                        Khám phá Thế giới Hoa
                      </span>
                      <Link
                        to="/categories"
                        className="text-xs font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-0.5"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        Tất cả danh mục <MaterialIcon name="arrow_forward" className="text-[14px]" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      {categories.slice(0, 12).map((cat) => (
                        <Link
                          key={cat._id}
                          to={`/category/${cat.slug}`}
                          className="flex items-center gap-3 rounded-2xl p-2 hover:bg-soft-amethyst/30 transition-colors duration-300 group"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-crystal-border/80 bg-lavender-mist">
                            <img
                              src={cat.imageUrl || "https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=150"}
                              alt={cat.name}
                              className="h-full w-full object-cover transition-transform duration-550 group-hover:scale-110"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-home-heading text-sm font-bold text-midnight-purple group-hover:text-primary transition-colors duration-200">
                              {cat.name}
                            </h4>
                            <p className="truncate text-[11px] text-dusk-gray group-hover:text-midnight-purple/70 transition-colors duration-200">
                              {cat.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            }

            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                className={navLinkClassName(active)}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          <div className="relative hidden min-w-0 items-center rounded-full border border-crystal-border bg-pure-ivory/70 px-3 py-1.5 transition-[border-color,box-shadow] focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/15 sm:flex md:max-w-[200px] lg:max-w-[240px] xl:max-w-[280px]">
            <MaterialIcon name="search" className="mr-1.5 shrink-0 text-dusk-gray text-[18px]" />
            <input
              className="min-w-0 flex-1 bg-transparent p-0 font-home-heading text-xs text-midnight-purple placeholder:text-dusk-gray focus:outline-none focus:ring-0 md:text-sm"
              placeholder="Tìm kiếm sản phẩm..."
              type="search"
              aria-label="Tìm kiếm sản phẩm"
             />
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {profile && (
              <div
                className="relative"
                onMouseEnter={() => setIsNotifDropdownOpen(true)}
                onMouseLeave={() => setIsNotifDropdownOpen(false)}
              >
                <button
                  type="button"
                  aria-label="Thông báo"
                  onClick={() => navigate("/user/profile/notifications")}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary active-press"
                >
                  <MaterialIcon name="notifications" className="text-[22px]" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-pure-ivory bg-primary px-1 text-[9px] font-bold text-pure-ivory animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute right-0 top-full mt-3 w-80 rounded-2xl glass-panel border border-crystal-border bg-pure-ivory/98 p-4 shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-300 z-[100] ${
                    isNotifDropdownOpen
                      ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
                      : "pointer-events-none opacity-0 translate-y-2 scale-95"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between border-b border-crystal-border pb-2">
                    <span className="font-home-heading text-xs font-bold text-deep-plum">
                      Thông báo ({unreadCount})
                    </span>
                    <Link
                      to="/user/profile/notifications"
                      className="text-[11px] font-bold text-primary hover:underline"
                      onClick={() => setIsNotifDropdownOpen(false)}
                    >
                      Xem tất cả
                    </Link>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2.5 scrollbar-none">
                    {notifications.length === 0 ? (
                      <p className="py-6 text-center text-xs text-dusk-gray font-home-heading">
                        Không có thông báo nào
                      </p>
                    ) : (
                      notifications.slice(0, 3).map((notif) => (
                        <div
                          key={notif._id}
                          onClick={async () => {
                            setIsNotifDropdownOpen(false);
                            if (!notif.isRead) {
                              try {
                                await dispatch(markAsRead(notif._id)).unwrap();
                                window.dispatchEvent(new CustomEvent("notification-updated"));
                              } catch (err) {
                                console.error(err);
                              }
                            }
                            navigate("/user/profile/notifications");
                          }}
                          className={`rounded-xl p-2.5 text-left transition-colors duration-200 cursor-pointer border ${
                            notif.isRead
                              ? "border-transparent bg-transparent hover:bg-soft-amethyst/10"
                              : "border-primary/10 bg-soft-amethyst/15 hover:bg-soft-amethyst/25"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className={`h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-1.5 ${
                              notif.isRead ? "opacity-0" : ""
                            }`} />
                            <div className="min-w-0 flex-1">
                              <h5 className="font-home-heading text-xs font-bold text-midnight-purple truncate">
                                {notif.notification?.title || "Thông báo"}
                              </h5>
                              <p className="mt-0.5 line-clamp-2 text-[11px] text-dusk-gray leading-normal">
                                {notif.notification?.body}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            <Link
              to="/cart"
              aria-label="Giỏ hàng"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary active-press"
            >
              <MaterialIcon name="shopping_bag" className="text-[22px]" />
              {totalQuantity > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-pure-ivory bg-primary px-1 text-[9px] font-bold text-pure-ivory animate-fade-in">
                  {totalQuantity}
                </span>
              )}
            </Link>
            <Link
              to={profile ? (profile.role?.toUpperCase() === "ADMIN" ? "/admin/profile/favorites" : "/user/profile/favorites") : "/login"}
              aria-label="Danh sách yêu thích"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary active-press"
            >
              <MaterialIcon name="favorite" className="text-[22px]" />
              {wishlistItems.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-pure-ivory bg-primary px-1 text-[9px] font-bold text-pure-ivory animate-fade-in">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            {showProfileLoading ? (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full bg-soft-amethyst/20 border border-crystal-border/60 font-home-heading text-sm text-dusk-gray"
                aria-label="Đang tải tài khoản"
              >
                …
              </div>
            ) : isLoggedIn ? (
              <div className="relative flex items-center" ref={userMenuRef}>
                <button
                  type="button"
                  aria-label="Tài khoản"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-soft-amethyst/30 border border-crystal-border/80 font-home-heading text-sm font-bold text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary active-press shadow-sm cursor-pointer overflow-hidden"
                  title={`Chào ${displayName}`}
                >
                  {profile?.avatar ? (
                    <img src={profile.avatar} alt={displayName} className="h-full w-full object-cover" />
                  ) : (
                    avatarInitial
                  )}
                </button>

                {/* Glassmorphic Dropdown User Menu */}
                <div
                  className={`absolute right-0 top-full mt-3 w-72 rounded-3xl glass-panel border border-crystal-border bg-pure-ivory/95 p-5 shadow-2xl backdrop-blur-xl transition-[opacity,transform] duration-300 z-[100] ${
                    isUserMenuOpen
                      ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
                      : "pointer-events-none opacity-0 translate-y-2 scale-95"
                  }`}
                >
                  {/* User Profile Info */}
                  <div className="flex flex-col items-center border-b border-crystal-border pb-4 mb-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-soft-amethyst/60 text-primary border border-white/60 text-xl font-bold shadow-inner mb-2.5 overflow-hidden">
                      {profile?.avatar ? (
                        <img src={profile.avatar} alt={displayName} className="h-full w-full object-cover" />
                      ) : (
                        avatarInitial
                      )}
                    </div>
                    <h4 className="font-home-heading text-sm font-bold text-midnight-purple leading-snug truncate w-full">
                      {displayName}
                    </h4>
                    <p className="text-[11px] text-dusk-gray font-medium truncate w-full mt-0.5">
                      {profile?.email ?? ""}
                    </p>
                    
                    {/* Role Badge */}
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold mt-2 shadow-sm ${
                      profile.role?.toUpperCase() === "ADMIN"
                        ? "text-[#e11d48] bg-[#e11d48]/10"
                        : ["SALES", "STORE_STAFF", "WAREHOUSE_STAFF"].includes(profile.role?.toUpperCase() || "")
                        ? "text-[#6366f1] bg-[#6366f1]/10"
                        : "text-[#0d9488] bg-[#0d9488]/10"
                    }`}>
                      <MaterialIcon name="verified" className="text-[11px] font-bold" />
                      {profile.role?.toUpperCase() === "ADMIN"
                        ? "Quản trị viên"
                        : ["SALES", "STORE_STAFF", "WAREHOUSE_STAFF"].includes(profile.role?.toUpperCase() || "")
                        ? "Nhân viên"
                        : "Khách hàng"}
                    </span>
                  </div>

                  {/* Navigation Links */}
                  <div className="space-y-1">
                    <Link
                      to="/user/profile/overview"
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-left font-home-heading text-xs font-bold text-midnight-purple hover:bg-soft-amethyst/20 hover:text-primary transition duration-200"
                    >
                      <MaterialIcon name="grid_view" className="text-[16px]" />
                      <span>Tổng quan tài khoản</span>
                    </Link>
                    <Link
                      to="/user/profile/favorites"
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-left font-home-heading text-xs font-bold text-midnight-purple hover:bg-soft-amethyst/20 hover:text-primary transition duration-200"
                    >
                      <MaterialIcon name="favorite" className="text-[16px]" />
                      <span>Sản phẩm yêu thích</span>
                    </Link>
                    <Link
                      to="/user/profile/notifications"
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-left font-home-heading text-xs font-bold text-midnight-purple hover:bg-soft-amethyst/20 hover:text-primary transition duration-200"
                    >
                      <MaterialIcon name="notifications" className="text-[16px]" />
                      <span>Thông báo của tôi</span>
                      {unreadCount > 0 ? (
                        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-pure-ivory">
                          {unreadCount}
                        </span>
                      ) : null}
                    </Link>
                    
                    {/* Admin Dashboard Access */}
                    {(profile.role?.toUpperCase() === "ADMIN" || 
                      ["SALES", "STORE_STAFF", "WAREHOUSE_STAFF"].includes(profile.role?.toUpperCase() || "")) && (
                      <Link
                        to={getDashboardBasePath(profile.role)}
                        className="flex items-center gap-3 rounded-xl bg-primary/5 px-3 py-2 text-left font-home-heading text-xs font-bold text-primary hover:bg-primary hover:text-pure-ivory transition duration-200 border border-primary/10 mt-2"
                      >
                        <MaterialIcon name="admin_panel_settings" className="text-[16px]" />
                        <span>Trang quản trị</span>
                      </Link>
                    )}

                    <hr className="border-crystal-border my-2" />

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await api.post("/api/v1/auth/logout");
                        } catch (err) {
                          console.error("Lỗi khi đăng xuất", err);
                        } finally {
                          clearAuthSessionFlag();
                          dispatch(resetAuth());
                          dispatch(resetProfile());
                          dispatch(resetNotifications());
                          navigate("/login");
                        }
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left font-home-heading text-xs font-bold text-error hover:bg-error/10 transition duration-200 cursor-pointer"
                    >
                      <MaterialIcon name="logout" className="text-[16px]" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                aria-label="Đăng nhập"
                className="flex items-center gap-1.5 rounded-full bg-soft-amethyst/30 border border-crystal-border/80 px-3.5 py-1.5 text-xs font-bold text-deep-plum backdrop-blur-md hover:bg-primary hover:text-pure-ivory hover:border-primary transition-[color,background-color,border-color,transform] duration-300 shadow-sm active-press"
              >
                <MaterialIcon name="login" className="text-sm shrink-0" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
            )}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary lg:hidden active-press"
              aria-expanded={mobileOpen}
              aria-controls={sheetId}
              aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <MaterialIcon name={mobileOpen ? "close" : "menu"} className="text-[24px]" />
            </button>
          </div>
        </div>
      </div>

      {mobileOpen ? (
        <div
          className="fixed inset-0 top-0 z-[55] bg-midnight-purple/40 backdrop-blur-sm lg:hidden"
          aria-hidden
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <nav
        className={`fixed inset-x-4 top-[calc(5rem+env(safe-area-inset-top))] z-[60] max-h-[min(70vh,520px)] overflow-y-auto rounded-3xl border border-crystal-border bg-pure-ivory/98 p-4 shadow-xl backdrop-blur-xl transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!mobileOpen}
        id={sheetId}
      >
        <div className="mb-3 flex items-center rounded-full border border-crystal-border bg-lavender-mist/80 px-3 py-2">
          <MaterialIcon name="search" className="mr-2 text-dusk-gray text-[20px]" />
          <input
            className="w-full bg-transparent font-home-heading text-sm text-midnight-purple placeholder:text-dusk-gray focus:outline-none"
            placeholder="Tìm kiếm sản phẩm..."
            type="search"
            aria-label="Tìm kiếm sản phẩm"
          />
        </div>
        <ul className="flex flex-col gap-1">
          {NAV_LINKS.map((item) => {
            if ('isDropdown' in item && item.isDropdown) {
              const active = pathname === "/categories" || pathname.startsWith("/category/");
              return (
                <li key={item.label} className="flex flex-col">
                  <div
                    className={`flex items-center justify-between rounded-2xl px-3 py-2.5 font-home-heading text-sm font-medium hover:bg-soft-amethyst/35 hover:text-primary transition-colors duration-200 ${
                      active ? "bg-soft-amethyst/20 text-primary" : "text-midnight-purple"
                    }`}
                  >
                    <Link
                      to={item.href}
                      className="flex-1 text-left font-bold"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMobileCategoriesOpen(!mobileCategoriesOpen);
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-amethyst/15 text-midnight-purple hover:bg-soft-amethyst/30 transition-colors duration-200"
                      aria-label="Mở rộng danh mục"
                    >
                      <MaterialIcon
                        name="expand_more"
                        className={`text-[18px] transition-transform duration-300 ${mobileCategoriesOpen ? "rotate-180 text-primary" : ""}`}
                      />
                    </button>
                  </div>
                  
                  {/* Collapsible Mobile Accordion Menu */}
                  <div
                    className={`overflow-hidden transition-[max-height,opacity,margin] duration-300 ${
                      mobileCategoriesOpen ? "max-h-[380px] opacity-100 mt-1 mb-2" : "max-h-0 opacity-0"
                    }`}
                  >
                    <ul className="ml-4 flex flex-col gap-1 border-l border-crystal-border/80 pl-3">
                      {categories.map((cat) => (
                        <li key={cat._id}>
                          <Link
                            to={`/category/${cat.slug}`}
                            className="block rounded-xl px-3 py-2 font-home-heading text-xs font-semibold text-dusk-gray hover:bg-soft-amethyst/20 hover:text-primary transition-colors duration-200"
                            onClick={() => {
                              setMobileOpen(false);
                              setMobileCategoriesOpen(false);
                            }}
                          >
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            }

            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={`block rounded-2xl px-3 py-3 font-home-heading text-sm font-medium hover:bg-soft-amethyst/35 hover:text-primary ${
                    active ? "border-l-4 border-primary bg-soft-amethyst/25 text-primary font-bold" : "text-midnight-purple"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
