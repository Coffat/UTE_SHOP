import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { clearLoginError, login } from "@/features/auth/authSlice";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

function GoogleGlyph({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookGlyph({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

function AppleGlyph({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </svg>
  );
}

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authStatus = useAppSelector((s) => s.auth.login.status);
  const authError = useAppSelector((s) => s.auth.login.error);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const emailId = useId();
  const passwordId = useId();

  const isLoading = authStatus === "loading";

  return (
    <AuthPageShell brandingBodyText="Đăng nhập để khám phá thế giới hoa tươi và những món quà ý nghĩa từ UTESHOP.">
      <AuthFormCard>
        <div className="relative mt-6">
          <h2 className="font-body-standard text-xl font-bold text-deep-plum sm:text-2xl">
            Chào mừng trở lại!
          </h2>
          <p className="mt-2 text-sm text-dusk-gray sm:text-base">Đăng nhập để tiếp tục trải nghiệm</p>

          <form
            className="mt-8 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const result = await dispatch(login({ email: email.trim(), password }));
              if (login.fulfilled.match(result)) {
                const to = result.payload.redirectUrl ?? "/";
                navigate(to, { replace: true });
              }
            }}
          >
            {authError ? (
              <p
                className="rounded-xl border border-error/40 bg-error-container/80 px-3 py-2 font-ui-label text-sm text-on-error-container"
                role="alert"
              >
                {authError}
              </p>
            ) : null}

            <div>
              <label htmlFor={emailId} className="sr-only">
                Email hoặc số điện thoại
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                <MaterialIcon name="person" className="shrink-0 text-dusk-gray text-[22px]" />
                <input
                  id={emailId}
                  name="email"
                  type="text"
                  autoComplete="username"
                  placeholder="Email hoặc số điện thoại"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    dispatch(clearLoginError());
                  }}
                  className="min-h-11 w-full bg-transparent font-body-standard text-sm text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                />
              </div>
            </div>

            <div>
              <label htmlFor={passwordId} className="sr-only">
                Mật khẩu
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                <MaterialIcon name="lock" className="shrink-0 text-dusk-gray text-[22px]" />
                <input
                  id={passwordId}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Mật khẩu"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    dispatch(clearLoginError());
                  }}
                  className="min-h-11 w-full flex-1 bg-transparent font-body-standard text-sm text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="flex size-11 shrink-0 items-center justify-center rounded-lg text-dusk-gray transition hover:bg-pure-ivory/80 hover:text-deep-plum"
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  <MaterialIcon name={showPassword ? "visibility_off" : "visibility"} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2 font-ui-label text-sm text-deep-plum">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-crystal-border bg-pure-ivory/90 text-[#ff758c] focus:ring-2 focus:ring-primary/30"
                  style={{ accentColor: "#ff758c" }}
                />
                Ghi nhớ đăng nhập
              </label>
              <Link
                to="/forgot-password"
                className="font-ui-label text-sm font-medium text-[#7158e2] underline-offset-2 hover:underline"
              >
                Quên mật khẩu?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-gradient-bg mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 font-ui-label text-sm font-semibold text-pure-ivory shadow-md transition hover:brightness-105 active:scale-[0.99] enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-14 sm:text-base"
            >
              {isLoading ? "Đang đăng nhập…" : "Đăng nhập"}
              <MaterialIcon name="arrow_forward" className="text-pure-ivory text-[20px]" />
            </button>
          </form>

          <div className="mt-8 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-crystal-border" />
            <span className="font-ui-label text-xs uppercase tracking-wide text-dusk-gray">hoặc</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-crystal-border" />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
            {[
              { name: "Google" as const, glyph: GoogleGlyph },
              { name: "Facebook" as const, glyph: FacebookGlyph },
              { name: "Apple" as const, glyph: AppleGlyph },
            ].map(({ name, glyph: Glyph }) => (
              <button
                key={name}
                type="button"
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/55 bg-pure-ivory/30 py-4 backdrop-blur-sm transition hover:bg-pure-ivory/45"
                style={{ WebkitBackdropFilter: "blur(8px)" }}
              >
                <Glyph className="size-7 sm:size-8" />
                <span className="font-ui-label text-[11px] font-medium text-deep-plum sm:text-xs">
                  {name}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-8 text-center font-body-standard text-sm text-dusk-gray">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#7158e2] underline-offset-2 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </AuthFormCard>
    </AuthPageShell>
  );
}
