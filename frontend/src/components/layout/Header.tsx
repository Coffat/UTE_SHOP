import { Link } from "react-router-dom";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

export function Header() {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[1440px] xl:max-w-[1600px] 2xl:max-w-[1760px] 3xl:max-w-[1920px] z-50">
      <div className="glass-panel rounded-full px-4 md:px-6 lg:px-8 xl:px-10 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 text-deep-plum">
          <div className="size-6 text-primary">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className="text-deep-plum text-xl font-bold font-sub-heading tracking-widest">
            UTESHOP
          </h2>
        </div>

        <div className="flex-1 justify-center hidden lg:flex relative mx-8">
          <div className="w-full max-w-md xl:max-w-lg 3xl:max-w-xl relative flex items-center bg-pure-ivory/60 rounded-full border border-crystal-border px-4 py-2 focus-within:bg-pure-ivory focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <MaterialIcon name="search" className="text-dusk-gray text-[20px] mr-2" />
            <input
              className="bg-transparent border-none w-full text-sm font-ui-label text-midnight-purple placeholder:text-dusk-gray focus:outline-none focus:ring-0 p-0"
              placeholder="Search for blooms..."
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6 lg:gap-8">
          <nav className="hidden md:flex items-center gap-6">
            <a
              className="text-deep-plum font-ui-label text-sm hover:text-primary transition-colors"
              href="#"
            >
              Bouquets
            </a>
            <a
              className="text-deep-plum font-ui-label text-sm hover:text-primary transition-colors"
              href="#"
            >
              Occasions
            </a>
            <a
              className="text-deep-plum font-ui-label text-sm hover:text-primary transition-colors"
              href="#"
            >
              Collections
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              to="/user/profile"
              aria-label="Tài khoản"
              className="text-deep-plum hover:text-primary transition-colors"
            >
              <MaterialIcon name="person" />
            </Link>
            <button
              type="button"
              aria-label="Cart"
              className="text-deep-plum hover:text-primary transition-colors relative"
            >
              <MaterialIcon name="shopping_bag" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-pure-ivory border border-pure-ivory">
                2
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
