import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { AppLogo } from "@/components/ui/AppLogo";

import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "@/store";
import { fetchProfile } from "@/features/profile/profileSlice";

const NAV_LINKS = [
  { label: "Trang chủ", href: "/" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Loại hoa lẻ", href: "#" },
  { label: "Bó hoa theo ngân sách", href: "#" },
  { label: "Tiệc & Sự kiện", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Hỗ trợ", href: "#" },
] as const;

function navLinkClassName(active: boolean) {
  const base =
    "font-home-heading rounded-2xl px-4 py-2.5 text-sm font-medium text-midnight-purple transition-colors hover:bg-soft-amethyst/40 hover:text-primary lg:px-0 lg:py-0 lg:hover:bg-transparent";
  const desktopActive =
    "lg:border-b-2 lg:border-primary lg:rounded-none lg:pb-0.5 lg:text-primary";
  return [base, active ? desktopActive : ""].filter(Boolean).join(" ");
}

export function Header() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navId = useId();
  const sheetId = `${navId}-sheet`;

  const dispatch = useDispatch<AppDispatch>();
  const { profile, fetchStatus } = useSelector((state: RootState) => state.profile);

  // Tự động tải thông tin người dùng một lần để kiểm tra trạng thái đăng nhập
  useEffect(() => {
    if (fetchStatus === "idle") {
      dispatch(fetchProfile());
    }
  }, [dispatch, fetchStatus]);

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
              className="flex h-10 w-10 items-center justify-center rounded-full text-deep-plum transition-colors hover:bg-soft-amethyst/40 hover:text-primary"
            >
              <MaterialIcon name="favorite" className="text-[22px]" />
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
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <li key={item.label}>
                <Link
                  to={item.href}
                  className={`block rounded-2xl px-3 py-3 font-home-heading text-sm font-medium hover:bg-soft-amethyst/35 hover:text-primary ${
                    active ? "border-l-4 border-primary bg-soft-amethyst/25 text-primary" : "text-midnight-purple"
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
