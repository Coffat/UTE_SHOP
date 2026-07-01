import React, { useState, useEffect } from 'react';
import { CrudModal, FormField, FormInput, FormSelect } from '../AdminUI';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/dark.css';

interface Voucher {
  _id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  minOrderAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  campaign?: { _id: string; name: string };
}

interface Campaign {
  _id: string;
  name: string;
  startDate?: string;
  endDate?: string;
}

export const VoucherTab: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'FIXED_AMOUNT',
    discountValue: '',
    maxDiscountAmount: '',
    usageLimit: '',
    minOrderAmount: '',
    startDate: '',
    endDate: '',
    campaign: '',
  });

  useEffect(() => {
    fetchVouchers();
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/v1/admin/campaigns', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data.filter((c: any) => c.isActive));
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const fetchVouchers = async () => {
    try {
      const res = await fetch('/api/v1/vouchers', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setVouchers(data.data);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...formData,
        discountValue: Number(formData.discountValue),
        maxDiscountAmount: formData.maxDiscountAmount ? Number(formData.maxDiscountAmount) : undefined,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        minOrderAmount: Number(formData.minOrderAmount),
      };
      if (!payload.campaign) payload.campaign = null;

      const url = editingVoucher 
        ? `/api/v1/vouchers/${editingVoucher._id}`
        : '/api/v1/vouchers';
      const method = editingVoucher ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setEditingVoucher(null);
        fetchVouchers();
        setFormData({
          code: '', discountType: 'FIXED_AMOUNT', discountValue: '', maxDiscountAmount: '',
          usageLimit: '', minOrderAmount: '', startDate: '', endDate: '', campaign: ''
        });
      } else {
        alert(data.message || 'Lỗi lưu voucher');
      }
    } catch (error) {
      console.error('Error saving voucher:', error);
    }
  };

  const handleOpenCreate = () => {
    setEditingVoucher(null);
    setFormData({
      code: '',
      discountType: 'FIXED_AMOUNT',
      discountValue: '',
      maxDiscountAmount: '',
      usageLimit: '',
      minOrderAmount: '',
      startDate: '',
      endDate: '',
      campaign: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v: Voucher) => {
    setEditingVoucher(v);
    setFormData({
      code: v.code,
      discountType: v.discountType,
      discountValue: v.discountValue.toString(),
      maxDiscountAmount: v.maxDiscountAmount ? v.maxDiscountAmount.toString() : '',
      usageLimit: v.usageLimit ? v.usageLimit.toString() : '',
      minOrderAmount: v.minOrderAmount.toString(),
      startDate: v.startDate,
      endDate: v.endDate,
      campaign: v.campaign?._id || '',
    });
    setIsModalOpen(true);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/vouchers/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchVouchers();
      }
    } catch (error) {
      console.error('Error toggling voucher:', error);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Danh sách Voucher</h2>
        <button
          onClick={handleOpenCreate}
          className="admin-btn admin-btn-primary"
        >
          + Thêm Voucher Mới
        </button>
      </div>

      <div className="admin-table-wrap" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Chiến dịch</th>
              <th>Loại giảm</th>
              <th>Giá trị</th>
              <th>Đã dùng / Giới hạn</th>
              <th>Hạn sử dụng</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Đang tải...</td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Chưa có voucher nào.</td></tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v._id} className="admin-table-row">
                  <td style={{ fontWeight: 600, color: '#6366f1', fontFamily: 'var(--adm-mono)' }}>{v.code}</td>
                  <td style={{ color: '#94a3b8', fontSize: '13px' }}>{v.campaign?.name || '-'}</td>
                  <td>{v.discountType === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Số tiền cố định'}</td>
                  <td style={{ fontWeight: 500, color: '#fff' }}>
                    {v.discountType === 'PERCENTAGE' 
                      ? `${v.discountValue}% (Tối đa ${v.maxDiscountAmount?.toLocaleString() || '∞'}đ)`
                      : `${v.discountValue.toLocaleString()}đ`}
                  </td>
                  <td>
                    {v.usedCount} / {v.usageLimit ? v.usageLimit : '∞'}
                  </td>
                  <td style={{ fontSize: '13px', color: '#e2e8f0' }}>
                    {new Date(v.startDate).toLocaleDateString('vi-VN')} - {new Date(v.endDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      background: v.isActive ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
                      color: v.isActive ? "#10b981" : "#f43f5e",
                      border: v.isActive ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(244, 63, 94, 0.25)"
                    }}>
                      {v.isActive ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                      <button style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                        color: "#3b82f6",
                        padding: "6px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s"
                      }} title="Sửa voucher" className="admin-action-glass-btn" onClick={() => handleOpenEdit(v)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleToggle(v._id, v.isActive)}
                        className="admin-action-glass-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          color: v.isActive ? '#f43f5e' : '#10b981',
                          border: `1px solid ${v.isActive ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                        }}
                      >
                        {v.isActive ? 'Vô hiệu hóa' : 'Kích hoạt'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CrudModal
        isOpen={isModalOpen}
        mode={editingVoucher ? "edit" : "create"}
        title={editingVoucher ? "Chỉnh sửa Voucher" : "Thêm Voucher Mới"}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        submitLabel={editingVoucher ? "Lưu thay đổi" : "Tạo Voucher"}
        size="lg"
      >
        <div className="admin-form-group">
          <div className="admin-form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <FormField label="Mã Voucher" required>
              <FormInput 
                required 
                disabled={!!editingVoucher}
                value={formData.code} 
                onChange={e => setFormData({...formData, code: e.target.value})} 
                placeholder="VD: SUMMER2024" 
              />
            </FormField>
            <FormField label="Loại giảm giá" required>
              <FormSelect 
                value={formData.discountType} 
                onChange={e => setFormData({...formData, discountType: e.target.value as any})}
              >
                <option value="FIXED_AMOUNT">Số tiền cố định (VNĐ)</option>
                <option value="PERCENTAGE">Phần trăm (%)</option>
              </FormSelect>
            </FormField>
          </div>

          <div className="admin-form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <FormField label="Giá trị giảm" required>
              <FormInput 
                required 
                type="number" 
                min="0" 
                value={formData.discountValue} 
                onChange={e => setFormData({...formData, discountValue: e.target.value})} 
                placeholder={formData.discountType === 'PERCENTAGE' ? "VD: 10 (%)" : "VD: 50000 (VNĐ)"} 
              />
            </FormField>
            {formData.discountType === 'PERCENTAGE' ? (
              <FormField label="Giá giảm tối đa (VNĐ)">
                <FormInput 
                  type="number" 
                  min="0" 
                  value={formData.maxDiscountAmount} 
                  onChange={e => setFormData({...formData, maxDiscountAmount: e.target.value})} 
                  placeholder="Không bắt buộc" 
                />
              </FormField>
            ) : <div />}
          </div>

          <div className="admin-form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <FormField label="Đơn hàng tối thiểu (VNĐ)" required>
              <FormInput 
                required 
                type="number" 
                min="0" 
                value={formData.minOrderAmount} 
                onChange={e => setFormData({...formData, minOrderAmount: e.target.value})} 
              />
            </FormField>
            <FormField label="Số lượt dùng tối đa">
              <FormInput 
                type="number" 
                min="1" 
                value={formData.usageLimit} 
                onChange={e => setFormData({...formData, usageLimit: e.target.value})} 
                placeholder="Trống = Không giới hạn" 
              />
            </FormField>
          </div>

          <div className="admin-form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <FormField label="Chiến dịch">
              <FormSelect 
                value={formData.campaign} 
                onChange={e => {
                  const campId = e.target.value;
                  const selectedCamp = campaigns.find(c => c._id === campId);
                  setFormData({
                    ...formData, 
                    campaign: campId,
                    ...(selectedCamp ? {
                      startDate: selectedCamp.startDate,
                      endDate: selectedCamp.endDate
                    } : {})
                  });
                }}
              >
                <option value="">Không tham gia chiến dịch</option>
                {campaigns.map(c => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </FormSelect>
            </FormField>
            <div />
          </div>

          <div className="admin-form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <FormField label="Ngày bắt đầu" required>
              <Flatpickr
                data-enable-time
                value={formData.startDate ? new Date(formData.startDate) : ""}
                onChange={([date]) => setFormData({...formData, startDate: date.toISOString()})}
                className="admin-form-input"
                options={{ time_24hr: true, dateFormat: "Z", altInput: true, altFormat: "d/m/Y H:i" }}
                placeholder="Chọn thời gian..."
              />
            </FormField>
            <FormField label="Ngày kết thúc" required>
              <Flatpickr
                data-enable-time
                value={formData.endDate ? new Date(formData.endDate) : ""}
                onChange={([date]) => setFormData({...formData, endDate: date.toISOString()})}
                className="admin-form-input"
                options={{ time_24hr: true, dateFormat: "Z", altInput: true, altFormat: "d/m/Y H:i" }}
                placeholder="Chọn thời gian..."
              />
            </FormField>
          </div>
        </div>
      </CrudModal>
    </div>
  );
};
