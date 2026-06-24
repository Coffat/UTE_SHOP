import { useEffect, useState } from "react";
import {
  fetchProvincesVn,
  fetchWardsByProvinceCode,
  ProvinceItem,
  WardItem,
} from "./provincesApi";

type ResolvedAddressParts = {
  province?: string;
  ward?: string;
  provinceCode?: number | null;
  wardCode?: string | null;
};

type VietnamAddressPickerProps = {
  onResolvedChange: (parts: ResolvedAddressParts) => void;
  className?: string;
};

export function VietnamAddressPicker({ onResolvedChange, className }: VietnamAddressPickerProps) {
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);

  const [provinceCode, setProvinceCode] = useState<number | null>(null);
  const [wardCode, setWardCode] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const bootstrap = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await fetchProvincesVn();
        if (!mounted) return;
        setProvinces(data);
      } catch {
        if (!mounted) return;
        setLoadError("Không tải được dữ liệu tỉnh thành. Vui lòng thử lại sau.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!provinceCode) {
      setWards([]);
      setWardCode(null);
      onResolvedChange({});
      return () => {
        mounted = false;
      };
    }

    const loadWards = async () => {
      try {
        const data = await fetchWardsByProvinceCode(provinceCode);
        if (!mounted) return;
        setWards([]);
        setWardCode(null);
        setWards(data);
      } catch {
        if (!mounted) return;
        setLoadError("Không tải được phường/xã. Vui lòng chọn lại tỉnh/thành.");
      }
    };
    void loadWards();
    return () => {
      mounted = false;
    };
  }, [provinceCode, onResolvedChange]);

  useEffect(() => {
    const provinceName = provinces.find((item) => item.code === provinceCode)?.name;
    if (!wardCode) {
      onResolvedChange({ province: provinceName, provinceCode, wardCode: null });
      return;
    }
    const wardName = wards.find((item) => item.code === wardCode)?.name;
    onResolvedChange({
      province: provinceName,
      ward: wardName,
      provinceCode,
      wardCode: wardCode ? String(wardCode) : null,
    });
  }, [wardCode, provinceCode, provinces, wards, onResolvedChange]);

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-semibold text-midnight-purple">Chọn nhanh theo địa giới hành chính VN 2026</p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-dusk-gray">Tỉnh/Thành phố</span>
          <select
            value={provinceCode ?? ""}
            onChange={(e) => setProvinceCode(e.target.value ? Number(e.target.value) : null)}
            className="h-11 w-full rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 text-sm text-deep-plum outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">{loading ? "Đang tải..." : "Chọn Tỉnh/Thành phố"}</option>
            {provinces.map((province) => (
              <option key={province.code} value={province.code}>
                {province.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-dusk-gray">Phường/Xã</span>
          <select
            value={wardCode ?? ""}
            disabled={!provinceCode}
            onChange={(e) => setWardCode(e.target.value ? Number(e.target.value) : null)}
            className="h-11 w-full rounded-xl border border-crystal-border bg-pure-ivory/90 px-3 text-sm text-deep-plum outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
          >
            <option value="">Chọn Phường/Xã</option>
            {wards.map((ward) => (
              <option key={ward.code} value={ward.code}>
                {ward.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      {loadError ? <p className="mt-2 text-xs text-error">{loadError}</p> : null}
    </div>
  );
}
