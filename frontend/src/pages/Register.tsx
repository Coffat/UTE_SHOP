import { useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthFormCard } from "@/components/auth/AuthFormCard";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { AuthSocialOAuthSection } from "@/components/auth/AuthSocialOAuthSection";
import {
  clearRegisterError,
  clearVerifyOtpError,
  registerUser,
  verifyRegistrationOtp,
} from "@/features/auth/authSlice";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export function Register() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const regStatus = useAppSelector((s) => s.auth.register.status);
  const regError = useAppSelector((s) => s.auth.register.error);
  const otpStatus = useAppSelector((s) => s.auth.verifyOtp.status);
  const otpError = useAppSelector((s) => s.auth.verifyOtp.error);

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fnId = useId();
  const emId = useId();
  const phId = useId();
  const pwId = useId();
  const cpId = useId();
  const otpId = useId();

  const isLoadingStep1 = regStatus === "loading";
  const isLoadingStep2 = otpStatus === "loading";

  return (
    <AuthPageShell brandingBodyText="Tạo tài khoản UTESHOP để đặt hoa tươi, theo dõi đơn và nhận ưu đãi dành riêng cho bạn.">
      <AuthFormCard>
        <div className="relative mt-6">
          {step === 1 ? (
            <>
              <h2 className="font-body-standard text-xl font-bold text-deep-plum sm:text-2xl">
                Tạo tài khoản
              </h2>
              <p className="mt-2 text-sm text-dusk-gray sm:text-base">
                Điền thông tin để bắt đầu — chúng tôi sẽ gửi mã xác minh qua email.
              </p>

              <form
                className="mt-8 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setClientError(null);
                  if (password.length < 6) {
                    setClientError("Mật khẩu cần ít nhất 6 ký tự.");
                    return;
                  }
                  if (password !== confirmPassword) {
                    setClientError("Mật khẩu xác nhận không khớp.");
                    return;
                  }
                  if (!fullName.trim()) {
                    setClientError("Vui lòng nhập họ và tên.");
                    return;
                  }
                  const result = await dispatch(
                    registerUser({
                      fullName: fullName.trim(),
                      email: email.trim(),
                      password,
                      phone: phone.trim() || "0",
                    })
                  );
                  if (registerUser.fulfilled.match(result)) {
                    setStep(2);
                    dispatch(clearRegisterError());
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
                {regError ? (
                  <p
                    className="rounded-xl border border-error/40 bg-error-container/80 px-3 py-2 font-ui-label text-sm text-on-error-container"
                    role="alert"
                  >
                    {regError}
                  </p>
                ) : null}

                <div>
                  <label htmlFor={fnId} className="sr-only">
                    Họ và tên
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                    <MaterialIcon name="badge" className="shrink-0 text-dusk-gray text-[22px]" />
                    <input
                      id={fnId}
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      placeholder="Họ và tên"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        dispatch(clearRegisterError());
                        setClientError(null);
                      }}
                      className="min-h-11 w-full bg-transparent font-body-standard text-sm text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                    />
                  </div>
                </div>

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
                      placeholder="Email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        dispatch(clearRegisterError());
                        setClientError(null);
                      }}
                      className="min-h-11 w-full bg-transparent font-body-standard text-sm text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={phId} className="sr-only">
                    Số điện thoại
                  </label>
                  <div className="flex items-center gap-3 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                    <MaterialIcon name="call" className="shrink-0 text-dusk-gray text-[22px]" />
                    <input
                      id={phId}
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="Số điện thoại"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        dispatch(clearRegisterError());
                        setClientError(null);
                      }}
                      className="min-h-11 w-full bg-transparent font-body-standard text-sm text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={pwId} className="sr-only">
                    Mật khẩu
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                    <MaterialIcon name="lock" className="shrink-0 text-dusk-gray text-[22px]" />
                    <input
                      id={pwId}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Mật khẩu (tối thiểu 6 ký tự)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        dispatch(clearRegisterError());
                        setClientError(null);
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

                <div>
                  <label htmlFor={cpId} className="sr-only">
                    Xác nhận mật khẩu
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/60 bg-pure-ivory/80 px-3 py-3 shadow-inner focus-within:ring-2 focus-within:ring-primary/40">
                    <MaterialIcon name="key" className="shrink-0 text-dusk-gray text-[22px]" />
                    <input
                      id={cpId}
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Nhập lại mật khẩu"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        dispatch(clearRegisterError());
                        setClientError(null);
                      }}
                      className="min-h-11 w-full flex-1 bg-transparent font-body-standard text-sm text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-lg text-dusk-gray transition hover:bg-pure-ivory/80 hover:text-deep-plum"
                      aria-label={showConfirm ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      <MaterialIcon name={showConfirm ? "visibility_off" : "visibility"} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoadingStep1}
                  className="login-gradient-bg mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 font-ui-label text-sm font-semibold text-pure-ivory shadow-md transition hover:brightness-105 active:scale-[0.99] enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-14 sm:text-base"
                >
                  {isLoadingStep1 ? "Đang gửi…" : "Đăng ký"}
                  <MaterialIcon name="arrow_forward" className="text-pure-ivory text-[20px]" />
                </button>
              </form>

              <AuthSocialOAuthSection />
            </>
          ) : (
            <>
              <h2 className="font-body-standard text-xl font-bold text-deep-plum sm:text-2xl">
                Xác minh email
              </h2>
              <p className="mt-2 text-sm text-dusk-gray sm:text-base">
                Nhập mã OTP 6 số đã gửi tới <strong className="text-deep-plum">{email}</strong>.
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
                  const result = await dispatch(
                    verifyRegistrationOtp({ email: email.trim(), otp: otp.trim() })
                  );
                  if (verifyRegistrationOtp.fulfilled.match(result)) {
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
                {otpError ? (
                  <p
                    className="rounded-xl border border-error/40 bg-error-container/80 px-3 py-2 font-ui-label text-sm text-on-error-container"
                    role="alert"
                  >
                    {otpError}
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
                        dispatch(clearVerifyOtpError());
                        setClientError(null);
                      }}
                      className="min-h-11 w-full bg-transparent font-body-standard text-sm tracking-widest text-deep-plum placeholder:text-dusk-gray/80 focus:outline-none sm:text-base"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoadingStep2}
                  className="login-gradient-bg mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 font-ui-label text-sm font-semibold text-pure-ivory shadow-md transition hover:brightness-105 active:scale-[0.99] enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-14 sm:text-base"
                >
                  {isLoadingStep2 ? "Đang xác minh…" : "Xác minh"}
                  <MaterialIcon name="check_circle" className="text-pure-ivory text-[20px]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp("");
                    dispatch(clearVerifyOtpError());
                    setClientError(null);
                  }}
                  className="w-full font-ui-label text-sm font-medium text-[#7158e2] underline-offset-2 hover:underline"
                >
                  Quay lại chỉnh sửa thông tin
                </button>
              </form>
            </>
          )}

          <p className="mt-8 text-center font-body-standard text-sm text-dusk-gray">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#7158e2] underline-offset-2 hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      </AuthFormCard>
    </AuthPageShell>
  );
}
