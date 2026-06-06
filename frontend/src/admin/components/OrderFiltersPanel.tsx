import { Slideover, FormField, FormSelect, FormInput } from "./AdminUI";
import type { OrderAdvancedFilters } from "../types/orderFilters.types";
import { EMPTY_ORDER_FILTERS } from "../types/orderFilters.types";

interface OrderFiltersPanelProps {
  isOpen: boolean;
  filters: OrderAdvancedFilters;
  onChange: (filters: OrderAdvancedFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onClose: () => void;
}

export function OrderFiltersPanel({
  isOpen,
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
}: OrderFiltersPanelProps) {
  const update = (patch: Partial<OrderAdvancedFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <Slideover isOpen={isOpen} title="Bộ lọc đơn hàng" onClose={onClose} width="400px">
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <FormField label="Từ ngày">
          <FormInput
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
          />
        </FormField>

        <FormField label="Đến ngày">
          <FormInput
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
          />
        </FormField>

        <FormField label="Loại đơn">
          <FormSelect
            value={filters.orderType}
            onChange={(e) => update({ orderType: e.target.value as OrderAdvancedFilters["orderType"] })}
          >
            <option value="">Tất cả</option>
            <option value="ONLINE">Online</option>
            <option value="AT_STORE">Tại cửa hàng</option>
          </FormSelect>
        </FormField>

        <FormField label="Trạng thái thanh toán">
          <FormSelect
            value={filters.paymentStatus}
            onChange={(e) =>
              update({ paymentStatus: e.target.value as OrderAdvancedFilters["paymentStatus"] })
            }
          >
            <option value="">Tất cả</option>
            <option value="SUCCESS">Đã thanh toán</option>
            <option value="PENDING">Chưa thanh toán</option>
            <option value="FAILED">Thất bại</option>
            <option value="REFUNDED">Hoàn tiền</option>
          </FormSelect>
        </FormField>

        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            style={{ flex: 1 }}
            onClick={onApply}
          >
            Áp dụng
          </button>
          <button
            type="button"
            className="admin-btn admin-btn-outline"
            style={{ flex: 1 }}
            onClick={() => {
              onChange({ ...EMPTY_ORDER_FILTERS });
              onReset();
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>
    </Slideover>
  );
}
