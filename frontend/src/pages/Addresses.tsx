import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { MaterialIcon } from "@/components/ui/MaterialIcon";
import { useToast } from "@/components/ui/ToastContext";
import {
  AddressDto,
  AddressPayload,
  createAddress,
  deleteAddress,
  fetchAddresses,
  formatAddressLine,
  setDefaultAddress,
  updateAddress,
} from "@/features/address/addressApi";
import { VietnamAddressPicker } from "@/features/address/VietnamAddressPicker";
import { UNAUTH } from "@/features/profile/profileSlice";
import { useNavigate, useLocation } from "react-router-dom";

const emptyForm: AddressPayload = {
  label: "",
  street: "",
  ward: "",
  district: "",
  city: "",
  isDefault: false,
};

const parseAxiosMessage = (error: unknown, fallback: string) => {
  if (!isAxiosError(error)) return fallback;
  if (error.response?.status === 401 || error.response?.status === 403) return UNAUTH;
  const body = error.response?.data as { message?: string; errors?: { message?: string }[] } | undefined;
  const firstValidation = body?.errors?.map((e) => e.message).filter(Boolean).join(" ");
  return firstValidation || body?.message || error.message || fallback;
};

export function Addresses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState<AddressDto[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<AddressPayload>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const isEditing = Boolean(editingId);

  const loadAddresses = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      const data = await fetchAddresses();
      setAddresses(data);
    } catch (err) {
      const message = parseAxiosMessage(err, "Không thể tải sổ địa chỉ");
      if (message === UNAUTH) {
        navigate("/login", { replace: true });
        return;
      }
      setError(message);
    } finally {
      setStatus("idle");
    }
  }, [navigate]);

  useEffect(() => {
    void loadAddresses();
  }, [loadAddresses]);

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      setShowForm(true);
      setEditingId(null);
      setForm(emptyForm);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const totalCount = addresses.length;
  const defaultAddress = useMemo(() => addresses.find((address) => address.isDefault), [addresses]);
  const composedAddressPreview = useMemo(
    () => [form.street, form.ward, form.district, form.city].filter(Boolean).join(", "),
    [form.street, form.ward, form.district, form.city]
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setShowForm(false);
  };

  const handleResolvedAreaChange = useCallback((parts: { province?: string; district?: string; ward?: string }) => {
    setForm((prev) => ({
      ...prev,
      city: parts.province ?? prev.city,
      district: parts.district ?? prev.district,
      ward: parts.ward ?? prev.ward,
    }));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    if (!form.street?.trim() || !form.city?.trim() || !form.ward?.trim()) {
      setFormError("Vui lòng chọn Tỉnh/TP, Phường/Xã và nhập số nhà/tên đường.");
      return;
    }
    setStatus("saving");
    try {
      if (isEditing && editingId) {
        await updateAddress(editingId, form);
        showToast("Đã cập nhật địa chỉ thành công", "success");
      } else {
        await createAddress(form);
        showToast("Đã thêm địa chỉ mới", "success");
      }
      resetForm();
      await loadAddresses();
    } catch (err) {
      const message = parseAxiosMessage(err, "Không thể lưu địa chỉ");
      if (message === UNAUTH) {
        navigate("/login", { replace: true });
        return;
      }
      setFormError(message);
    } finally {
      setStatus("idle");
    }
  };

  const handleStartEdit = (address: AddressDto) => {
    setEditingId(address._id);
    setForm({
      label: address.label || "",
      street: address.street,
      ward: address.ward || "",
      district: address.district || "",
      city: address.city,
      isDefault: address.isDefault,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSetDefault = async (id: string) => {
    setStatus("saving");
    try {
      await setDefaultAddress(id);
      showToast("Đã đặt địa chỉ mặc định", "success");
      await loadAddresses();
    } catch (err) {
      const message = parseAxiosMessage(err, "Không thể đặt địa chỉ mặc định");
      if (message === UNAUTH) {
        navigate("/login", { replace: true });
        return;
      }
      showToast(message, "error");
    } finally {
      setStatus("idle");
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này không?");
    if (!confirmed) {
      return;
    }
    setStatus("saving");
    try {
      await deleteAddress(id);
      showToast("Đã xóa địa chỉ", "success");
      await loadAddresses();
    } catch (err) {
      const message = parseAxiosMessage(err, "Không thể xóa địa chỉ");
      if (message === UNAUTH) {
        navigate("/login", { replace: true });
        return;
      }
      showToast(message, "error");
    } finally {
      setStatus("idle");
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-[24px] border border-white/60 p-6 shadow-[0_10px_40px_rgba(168,85,247,0.05)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 font-section-title text-[32px] text-deep-plum">
              <MaterialIcon name="location_on" className="text-[28px] text-primary" />
              Sổ địa chỉ
            </h2>
            <p className="mt-1 text-sm font-medium text-dusk-gray">
              Quản lý địa chỉ giao hoa để thanh toán nhanh hơn
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-crystal-border/80 bg-pure-ivory/80 px-4 py-2 text-sm font-bold text-deep-plum">
              {totalCount} địa chỉ
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setFormError(null);
                setShowForm(true);
              }}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-dreamy-purple px-5 text-sm font-semibold text-deep-plum transition hover:brightness-105"
            >
              <MaterialIcon name="add" className="text-[16px]" />
              Thêm mới
            </button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/40 bg-error-container/80 px-4 py-2 text-sm text-on-error-container" role="alert">
          {error}
        </div>
      ) : null}

      {showForm ? (
        <form onSubmit={handleSubmit} className="glass-panel rounded-[24px] border border-white/60 p-5 shadow-[0_10px_40px_rgba(168,85,247,0.04)] md:p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-deep-plum">
            <MaterialIcon name={isEditing ? "edit_square" : "add_location_alt"} className="text-[20px] text-primary" />
            {isEditing ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h3>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <VietnamAddressPicker onResolvedChange={handleResolvedAreaChange} />
            </div>
            <div className="md:col-span-2 h-px bg-crystal-border/70" />
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-dusk-gray">Nhãn địa chỉ</span>
              <input
                value={form.label ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Nhà riêng / Văn phòng"
                className="w-full rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 py-2.5 text-sm text-deep-plum outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-dusk-gray">Số nhà, tên đường</span>
              <input
                required
                value={form.street ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, street: e.target.value }))}
                placeholder="Ví dụ: 25 Nguyễn Huệ"
                className="w-full rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 py-2.5 text-sm text-deep-plum outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>
            <div className="md:col-span-2 rounded-xl border border-white/60 bg-pure-ivory/70 px-3 py-2.5">
              <p className="text-xs font-medium text-dusk-gray">Địa chỉ sẽ lưu</p>
              <p className="mt-0.5 text-sm font-semibold text-midnight-purple">
                {composedAddressPreview || "Chưa đủ thông tin để tạo địa chỉ"}
              </p>
            </div>
          </div>

          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-midnight-purple">
            <input
              type="checkbox"
              checked={Boolean(form.isDefault)}
              onChange={(e) => setForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
              className="h-4 w-4 accent-primary"
            />
            Đặt làm địa chỉ mặc định
          </label>

          {formError ? (
            <p className="mt-3 rounded-xl border border-error/40 bg-error-container/80 px-3 py-2 text-sm text-on-error-container" role="alert">
              {formError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "saving"}
              className="inline-flex min-h-11 items-center rounded-full bg-dreamy-purple px-6 text-sm font-semibold text-deep-plum transition hover:brightness-105 disabled:opacity-60"
            >
              {status === "saving" ? "Đang lưu..." : isEditing ? "Cập nhật địa chỉ" : "Lưu địa chỉ"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex min-h-11 items-center rounded-full bg-pure-ivory/85 px-6 text-sm font-medium text-midnight-purple transition hover:bg-white"
            >
              Hủy
            </button>
          </div>
        </form>
      ) : null}

      {status === "loading" ? (
        <div className="flex h-36 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : addresses.length === 0 ? (
        !showForm ? (
            <div className="glass-panel rounded-[24px] border border-white/60 p-10 text-center shadow-[0_10px_40px_rgba(168,85,247,0.05)]">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-white/60 bg-pure-ivory/85 text-dusk-gray/80">
                <MaterialIcon name="location_off" className="text-[26px]" />
              </div>
              <h3 className="text-base font-semibold text-deep-plum">Bạn chưa có địa chỉ nào</h3>
              <p className="mt-1 text-sm text-dusk-gray">Hãy thêm địa chỉ để đặt hoa nhanh hơn ở lần thanh toán tới.</p>
            </div>
          ) : null
      ) : (
        <>
          {showForm ? (
            <h4 className="text-sm font-semibold text-midnight-purple">Địa chỉ đã lưu</h4>
          ) : null}
          <div className="grid gap-4">
            {addresses.map((address) => (
              <article
                key={address._id}
                className="glass-panel rounded-[22px] border border-white/60 p-4 shadow-[0_10px_40px_rgba(168,85,247,0.04)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-amethyst/50 text-primary">
                    <MaterialIcon name="location_on" className="text-[20px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-midnight-purple">{address.label || "Địa chỉ giao hàng"}</p>
                      {address.isDefault ? (
                        <span className="rounded-full bg-soft-amethyst/60 px-2 py-0.5 text-xs font-semibold text-primary">
                          Mặc định
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-dusk-gray">{formatAddressLine(address)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!address.isDefault ? (
                    <button
                      type="button"
                      onClick={() => void handleSetDefault(address._id)}
                      className="rounded-xl border border-dreamy-purple/40 bg-pure-ivory/80 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-white"
                    >
                      Đặt mặc định
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(address)}
                    className="rounded-xl border border-crystal-border bg-pure-ivory/80 px-3 py-2 text-xs font-semibold text-midnight-purple transition hover:bg-white"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(address._id)}
                    className="rounded-xl border border-error/30 bg-error/10 px-3 py-2 text-xs font-semibold text-error transition hover:bg-error/20"
                  >
                    Xóa
                  </button>
                </div>
              </article>
            ))}
          </div>

          {defaultAddress ? (
            <p className="text-xs text-dusk-gray">
              Địa chỉ mặc định hiện tại: <span className="font-semibold text-midnight-purple">{formatAddressLine(defaultAddress)}</span>
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
