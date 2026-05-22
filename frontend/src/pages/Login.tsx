import { useId, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AuthSocialOAuthSection } from "@/components/auth/AuthSocialOAuthSection";
import { clearLoginError, login } from "@/features/auth/authSlice";
import { fetchProfile } from "@/features/profile/profileSlice";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function Login() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
                await dispatch(fetchProfile());
                const redirectParam = searchParams.get("redirect");
                const to = redirectParam || result.payload.redirectUrl || "/";
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

          <AuthSocialOAuthSection />

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
