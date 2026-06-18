import { useId, useState } from "react";
import { isAxiosError } from "axios";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { changeUserPassword } from "./profileApi";

type ChangePasswordFormProps = {
  onCancel: () => void;
  onSuccess?: () => void;
};

export function ChangePasswordForm({ onCancel, onSuccess }: ChangePasswordFormProps) {
  const currentId = useId();
  const newId = useId();
  const confirmId = useId();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSaving(true);
    try {
      await changeUserPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Đổi mật khẩu thành công.");
      onSuccess?.();
    } catch (err) {
      if (isAxiosError(err)) {
        const msg = (err.response?.data as { message?: string })?.message;
        setError(msg ?? "Không thể đổi mật khẩu.");
      } else {
        setError(err instanceof Error ? err.message : "Không thể đổi mật khẩu.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      className="mt-5 grid gap-3 rounded-2xl border border-white/60 bg-pure-ivory/55 p-4 md:grid-cols-2 shadow-sm"
      onSubmit={handleSubmit}
    >
      {error ? (
        <p className="md:col-span-2 rounded-xl border border-error/40 bg-error-container/80 px-4 py-2 text-sm text-on-error-container" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="md:col-span-2 rounded-xl border border-safe-mint/50 bg-safe-mint/30 px-4 py-2 text-sm text-deep-plum" role="status">
          {success}
        </p>
      ) : null}

      <div className="md:col-span-2">
        <label htmlFor={currentId} className="mb-1 block text-xs font-medium text-dusk-gray">
          Mật khẩu hiện tại
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/40">
          <MaterialIcon name="lock" className="text-[18px] text-dusk-gray" />
          <input
            id={currentId}
            type={showCurrent ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full bg-transparent text-sm text-deep-plum outline-none"
          />
          <button type="button" onClick={() => setShowCurrent((v) => !v)} className="text-dusk-gray">
            <MaterialIcon name={showCurrent ? "visibility_off" : "visibility"} className="text-[18px]" />
          </button>
        </div>
      </div>

      <div>
        <label htmlFor={newId} className="mb-1 block text-xs font-medium text-dusk-gray">
          Mật khẩu mới
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/40">
          <MaterialIcon name="lock_reset" className="text-[18px] text-dusk-gray" />
          <input
            id={newId}
            type={showNew ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-transparent text-sm text-deep-plum outline-none"
          />
          <button type="button" onClick={() => setShowNew((v) => !v)} className="text-dusk-gray">
            <MaterialIcon name={showNew ? "visibility_off" : "visibility"} className="text-[18px]" />
          </button>
        </div>
      </div>

      <div>
        <label htmlFor={confirmId} className="mb-1 block text-xs font-medium text-dusk-gray">
          Xác nhận mật khẩu mới
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 py-2.5 focus-within:ring-2 focus-within:ring-primary/40">
          <MaterialIcon name="lock_reset" className="text-[18px] text-dusk-gray" />
          <input
            id={confirmId}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full bg-transparent text-sm text-deep-plum outline-none"
          />
        </div>
      </div>

      <div className="md:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-11 items-center rounded-full bg-dreamy-purple px-6 text-sm font-semibold text-deep-plum transition hover:brightness-105 disabled:opacity-60 shadow-sm"
        >
          {saving ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full bg-pure-ivory/85 px-6 text-sm font-medium text-midnight-purple hover:bg-white transition"
          onClick={onCancel}
        >
          Hủy
        </button>
      </div>
    </form>
  );
}
