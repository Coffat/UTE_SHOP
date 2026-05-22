import { useEffect, useId, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { AppLogo } from "@/components/ui/AppLogo";
import { api } from "@/lib/api";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchProfile } from "@/features/profile/profileSlice";
import { fetchWishlist } from "@/features/wishlist/wishlistSlice";
import { fetchCategories } from "@/features/catalog/categoriesSlice";

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

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const fetchNotifications = async () => {
    if (!profile) return;
    try {
      const { data } = await api.get("/api/v1/notifications");
      if (data.success && data.data) {
        setNotifications(data.data || []);
        const unread = data.data.filter((n: any) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (err) {
      console.error("Error fetching notifications in header", err);
    }
  };

  useEffect(() => {
    if (profile) {
      void fetchNotifications();
    }
  }, [profile]);

  useEffect(() => {
    const handleUpdate = () => {
      void fetchNotifications();
    };
    window.addEventListener("notification-updated", handleUpdate);
    return () => {
      window.removeEventListener("notification-updated", handleUpdate);
    };
  }, [profile]);

  // Tải danh mục hoa từ database khi khởi chạy
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchCategories());
    }
  }, [dispatch, categories.length]);

  // Tự động tải thông tin người dùng một lần để kiểm tra trạng thái đăng nhập
  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchProfile());
    }
  }, [dispatch, fetchStatus]);

  // Tải danh sách yêu thích khi thông tin người dùng được tải thành công
  useEffect(() => {
    if (profile && wishlistStatus === "idle") {
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
                    className={`absolute top-full left-1/2 -translate-x-1/2 mt-3.5 w-[560px] rounded-3xl glass-panel border border-crystal-border bg-pure-ivory/98 p-5 shadow-2xl backdrop-blur-xl transition-all duration-300 z-[100] ${
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
                          className="flex items-center gap-3 rounded-2xl p-2 hover:bg-soft-amethyst/30 transition-all duration-300 group"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-crystal-border/80 bg-lavender-mist">
                            <img
                              src={cat.imageUrl || "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=150"}
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
          <div className="relative hidden min-w-0 items-center rounded-full border border-crystal-border bg-pure-ivory/70 px-3 py-1.5 transition-all focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/15 sm:flex md:max-w-[200px] lg:max-w-[240px] xl:max-w-[280px]">
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
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary"
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
                  className={`absolute right-0 top-full mt-3 w-80 rounded-2xl glass-panel border border-crystal-border bg-pure-ivory/98 p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 z-[100] ${
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
                      notifications.slice(0, 3).map((notif: any) => (
                        <div
                          key={notif._id}
                          onClick={async () => {
                            setIsNotifDropdownOpen(false);
                            if (!notif.isRead) {
                              try {
                                await api.patch(`/api/v1/notifications/${notif._id}/read`);
                                void fetchNotifications();
                                window.dispatchEvent(new CustomEvent("notification-updated"));
                              } catch (err) {
                                console.error(err);
                              }
                            }
                            navigate("/user/profile/notifications");
                          }}
                          className={`rounded-xl p-2.5 text-left transition-all duration-200 cursor-pointer border ${
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

            {profile ? (
              <Link
                to="/user/profile"
                aria-label="Tài khoản"
                className="flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary"
                title={`Chào ${profile.fullName}`}
              >
                <MaterialIcon name="person" className="text-[22px]" />
              </Link>
            ) : (
              <Link
                to="/login"
                aria-label="Đăng nhập"
                className="flex items-center gap-1.5 rounded-full bg-soft-amethyst/30 border border-crystal-border/80 px-3.5 py-1.5 text-xs font-bold text-deep-plum backdrop-blur-md hover:bg-primary hover:text-pure-ivory hover:border-primary transition-all duration-300 shadow-sm"
              >
                <MaterialIcon name="login" className="text-sm shrink-0" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
            )}
            <Link
              to={profile ? (profile.role === "admin" ? "/admin/profile/favorites" : "/user/profile/favorites") : "/login"}
              aria-label="Danh sách yêu thích"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary"
            >
              <MaterialIcon name="favorite" className="text-[22px]" />
              {wishlistItems.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-pure-ivory bg-primary px-1 text-[9px] font-bold text-pure-ivory animate-fade-in">
                  {wishlistItems.length}
                </span>
              )}
            </Link>
            <Link
              to="/cart"
              aria-label="Giỏ hàng"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary"
            >
              <MaterialIcon name="shopping_bag" className="text-[22px]" />
              {totalQuantity > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-pure-ivory bg-primary px-1 text-[9px] font-bold text-pure-ivory animate-fade-in">
                  {totalQuantity}
                </span>
              )}
            </Link>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary lg:hidden"
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
        className={`fixed inset-x-4 top-[calc(5rem+env(safe-area-inset-top))] z-[60] max-h-[min(70vh,520px)] overflow-y-auto rounded-3xl border border-crystal-border bg-pure-ivory/98 p-4 shadow-xl backdrop-blur-xl transition-all lg:hidden ${
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
                    className={`flex items-center justify-between rounded-2xl px-3 py-2.5 font-home-heading text-sm font-medium hover:bg-soft-amethyst/35 hover:text-primary transition-all duration-200 ${
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
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-soft-amethyst/15 text-midnight-purple hover:bg-soft-amethyst/30 transition-all duration-200"
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
                    className={`overflow-hidden transition-all duration-300 ${
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
