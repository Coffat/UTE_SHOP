import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AuthSocialOAuthSection } from "@/components/auth/AuthSocialOAuthSection";
import {
  clearForgotPasswordError,
  clearResetPasswordError,
  forgotPassword,
  resetPassword,
} from "@/features/auth/authSlice";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function ForgotPassword() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const forgotStatus = useAppSelector((s) => s.auth.forgotPassword.status);
  const forgotError = useAppSelector((s) => s.auth.forgotPassword.error);
  const resetStatus = useAppSelector((s) => s.auth.resetPassword.status);
  const resetError = useAppSelector((s) => s.auth.resetPassword.error);

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  const emId = useId();
  const otpId = useId();
  const npId = useId();
  const cpId = useId();

  const loading1 = forgotStatus === "loading";
  const loading2 = resetStatus === "loading";

  return (
    <AuthPageShell brandingBodyText="Khôi phục mật khẩu an toàn qua email — nhập địa chỉ đã đăng ký để nhận mã OTP.">
      <AuthFormCard>
        <div className="relative mt-6">
          {step === 1 ? (
            <>
              <h2 className="font-body-standard text-xl font-bold text-deep-plum sm:text-2xl">
                Quên mật khẩu?
              </h2>
              <p className="mt-2 text-sm text-dusk-gray sm:text-base">
                Nhập email tài khoản — chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
              </p>

              <form
                className="mt-8 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setClientError(null);
                  const result = await dispatch(forgotPassword({ email: email.trim() }));
                  if (forgotPassword.fulfilled.match(result)) {
                    setStep(2);
                    dispatch(clearForgotPasswordError());
                  }
                }}
              >
                {forgotError ? (
                  <p
                    className="rounded-xl border border-error/40 bg-error-container/80 px-3 py-2 font-ui-label text-sm text-on-error-container"
                    role="alert"
                  >
                    {forgotError}
                  </p>
                ) : null}

                <div>
                  <label htmlFor={emId} className="sr-only">
                    Email
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                    <MaterialIcon name="mail" className="shrink-0 text-dusk-gray text-[22px]" />
                    <input
                      id={emId}
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Email đã đăng ký"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        dispatch(clearForgotPasswordError());
                      }}
                      className="min-h-11 w-full bg-transparent font-body-standard text-sm text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading1}
                  className="login-gradient-bg mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 font-ui-label text-sm font-semibold text-pure-ivory shadow-md transition hover:brightness-105 active:scale-[0.99] enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-14 sm:text-base"
                >
                  {loading1 ? "Đang gửi…" : "Gửi mã OTP"}
                  <MaterialIcon name="send" className="text-pure-ivory text-[20px]" />
                </button>
              </form>

              <AuthSocialOAuthSection />
            </>
          ) : (
            <>
              <h2 className="font-body-standard text-xl font-bold text-deep-plum sm:text-2xl">
                Đặt lại mật khẩu
              </h2>
              <p className="mt-2 text-sm text-dusk-gray sm:text-base">
                Mã đã gửi tới <strong className="text-deep-plum">{email}</strong>. Nhập OTP và mật khẩu
                mới.
              </p>

              <form
                className="mt-8 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setClientError(null);
                  if (otp.trim().length < 6) {
                    setClientError("Vui lòng nhập mã OTP đầy đủ.");
                    return;
                  }
                  if (newPassword.length < 6) {
                    setClientError("Mật khẩu mới cần ít nhất 6 ký tự.");
                    return;
                  }
                  if (newPassword !== confirmPassword) {
                    setClientError("Mật khẩu xác nhận không khớp.");
                    return;
                  }
                  const result = await dispatch(
                    resetPassword({
                      email: email.trim(),
                      otp: otp.trim(),
                      newPassword,
                    })
                  );
                  if (resetPassword.fulfilled.match(result)) {
                    navigate("/login", { replace: true });
                  }
                }}
              >
                {clientError ? (
                  <p
                    className="rounded-xl border border-error/40 bg-error-container/80 px-3 py-2 font-ui-label text-sm text-on-error-container"
                    role="alert"
                  >
                    {clientError}
                  </p>
                ) : null}
                {resetError ? (
                  <p
                    className="rounded-xl border border-error/40 bg-error-container/80 px-3 py-2 font-ui-label text-sm text-on-error-container"
                    role="alert"
                  >
                    {resetError}
                  </p>
                ) : null}

                <div>
                  <label htmlFor={otpId} className="sr-only">
                    Mã OTP
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                    <MaterialIcon name="sms" className="shrink-0 text-dusk-gray text-[22px]" />
                    <input
                      id={otpId}
                      name="otp"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="Mã OTP 6 số"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                        dispatch(clearResetPasswordError());
                        setClientError(null);
                      }}
                      className="min-h-11 w-full bg-transparent font-body-standard text-sm tracking-widest text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={npId} className="sr-only">
                    Mật khẩu mới
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                    <MaterialIcon name="lock" className="shrink-0 text-dusk-gray text-[22px]" />
                    <input
                      id={npId}
                      name="newPassword"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Mật khẩu mới"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        dispatch(clearResetPasswordError());
                        setClientError(null);
                      }}
                      className="min-h-11 w-full flex-1 bg-transparent font-body-standard text-sm text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-dusk-gray transition hover:bg-pure-ivory/80 hover:text-deep-plum"
                      aria-label={showPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <MaterialIcon name={showPw ? "visibility_off" : "visibility"} />
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor={cpId} className="sr-only">
                    Xác nhận mật khẩu
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                    <MaterialIcon name="key" className="shrink-0 text-dusk-gray text-[22px]" />
                    <input
                      id={cpId}
                      name="confirmPassword"
                      type={showCf ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        dispatch(clearResetPasswordError());
                        setClientError(null);
                      }}
                      className="min-h-11 w-full flex-1 bg-transparent font-body-standard text-sm text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCf((v) => !v)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-dusk-gray transition hover:bg-pure-ivory/80 hover:text-deep-plum"
                      aria-label={showCf ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <MaterialIcon name={showCf ? "visibility_off" : "visibility"} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading2}
                  className="login-gradient-bg mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 font-ui-label text-sm font-semibold text-pure-ivory shadow-md transition hover:brightness-105 active:scale-[0.99] enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-14 sm:text-base"
                >
                  {loading2 ? "Đang cập nhật…" : "Đặt lại mật khẩu"}
                  <MaterialIcon name="check_circle" className="text-pure-ivory text-[20px]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    setNewPassword("");
                    setConfirmPassword("");
                    dispatch(clearResetPasswordError());
                    setClientError(null);
                  }}
                  className="w-full font-ui-label text-sm font-medium text-[#7158e2] underline-offset-2 hover:underline"
                >
                  Quay lại nhập email
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center font-body-standard text-sm text-dusk-gray">
            <Link
              to="/login"
              className="font-semibold text-[#7158e2] underline-offset-2 hover:underline"
            >
              Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </AuthFormCard>
    </AuthPageShell>
  );
}
