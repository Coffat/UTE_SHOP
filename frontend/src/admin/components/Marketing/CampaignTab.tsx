import React, { useState, useEffect } from 'react';
import { uploadAdminImage, resolveAssetUrl } from '../../services/adminUpload.api';
import { CrudModal, Modal, FormField, FormInput, FormTextarea } from '../AdminUI';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/dark.css';

interface Campaign {
  _id: string;
  name: string;
  description: string;
  bannerUrl: string | null;
  showPopup: boolean;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface CampaignStats {
  totalVouchers: number;
  totalUsedCount: number;
}

export const CampaignTab: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    bannerUrl: '' as string | null,
    showPopup: false,
    startDate: '',
    endDate: '',
  });

  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [stats, setStats] = useState<CampaignStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/v1/admin/campaigns', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isUpdate = !!editingCampaign;
      const url = isUpdate 
        ? `/api/v1/admin/campaigns/${editingCampaign._id}`
        : `/api/v1/admin/campaigns`;
        
      const res = await fetch(url, {
        method: isUpdate ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchCampaigns();
        resetForm();
      } else {
        alert(data.message || 'Lỗi khi lưu chiến dịch');
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', bannerUrl: null, showPopup: false, startDate: '', endDate: '' });
    setEditingCampaign(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const result = await uploadAdminImage(file);
      setFormData(prev => ({ ...prev, bannerUrl: result.url }));
    } catch (error) {
      console.error("Failed to upload image:", error);
      alert("Lỗi khi tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const openUpdateModal = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      bannerUrl: campaign.bannerUrl || null,
      showPopup: campaign.showPopup || false,
      startDate: campaign.startDate,
      endDate: campaign.endDate
    });
    setIsModalOpen(true);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/v1/admin/campaigns/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchCampaigns();
      }
    } catch (error) {
      console.error('Error toggling campaign:', error);
    }
  };

  const openStats = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsStatsOpen(true);
    setIsStatsLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/campaigns/${campaign._id}/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    } finally {
      setIsStatsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Danh sách Chiến dịch</h2>
        <button
          onClick={openCreateModal}
          className="admin-btn admin-btn-primary"
        >
          + Thêm Chiến dịch
        </button>
      </div>

      <div className="admin-table-wrap" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Tên chiến dịch</th>
              <th>Thời gian diễn ra</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Đang tải...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Chưa có chiến dịch nào.</td></tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c._id} className="admin-table-row">
                  <td style={{ fontWeight: 600, color: '#6366f1' }}>{c.name}</td>
                  <td style={{ fontSize: '13px', color: '#e2e8f0' }}>
                    {new Date(c.startDate).toLocaleDateString('vi-VN')} - {new Date(c.endDate).toLocaleDateString('vi-VN')}
                  </td>
                  <td>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "4px 10px",
                      borderRadius: "20px",
                      fontSize: "11.5px",
                      fontWeight: 600,
                      background: c.isActive ? "rgba(16, 185, 129, 0.12)" : "rgba(244, 63, 94, 0.12)",
                      color: c.isActive ? "#10b981" : "#f43f5e",
                      border: c.isActive ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(244, 63, 94, 0.25)"
                    }}>
                      {c.isActive ? 'Đang chạy' : 'Tạm dừng'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => openStats(c)}
                        className="admin-action-glass-btn"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Thống kê
                      </button>
                      <button 
                        onClick={() => openUpdateModal(c)}
                        className="admin-action-glass-btn"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => handleToggle(c._id, c.isActive)}
                        className="admin-action-glass-btn"
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          color: c.isActive ? '#f43f5e' : '#10b981',
                          border: `1px solid ${c.isActive ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                        }}
                      >
                        {c.isActive ? 'Dừng' : 'Chạy'}
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
        mode={editingCampaign ? "edit" : "create"}
        title={editingCampaign ? "Chỉnh sửa Chiến dịch" : "Thêm Chiến dịch Mới"}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        submitLabel={editingCampaign ? "Cập nhật" : "Tạo Chiến dịch"}
      >
        <div className="admin-form-group">
          <FormField label="Tên chiến dịch" required>
            <FormInput 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              placeholder="VD: Flash Sale Mùa Hè" 
            />
          </FormField>

          <FormField label="Mô tả">
            <FormTextarea 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              placeholder="Mô tả chi tiết chiến dịch..." 
            />
          </FormField>

          <FormField label="Ảnh Banner (Popup)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isUploadingImage}
                style={{ fontSize: '14px' }}
              />
              {isUploadingImage && <span style={{ fontSize: '12px', color: '#10b981' }}>Đang tải ảnh lên...</span>}
              {formData.bannerUrl && (
                <div style={{ marginTop: '10px' }}>
                  <img
                    src={resolveAssetUrl(formData.bannerUrl)}
                    alt="Banner Preview"
                    style={{ maxHeight: '150px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </div>
              )}
            </div>
          </FormField>

          <FormField label="Hiển thị Popup Banner?">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={formData.showPopup}
                onChange={e => setFormData({...formData, showPopup: e.target.checked})}
                style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
              />
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>Bật popup cho chiến dịch này</span>
            </label>
          </FormField>

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

      <Modal
        isOpen={isStatsOpen}
        title="Thống kê Chiến dịch"
        onClose={() => setIsStatsOpen(false)}
        size="md"
      >
        {selectedCampaign && (
          <div style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--adm-border)' }}>
            <h4 style={{ margin: '0 0 4px', color: '#fff', fontSize: '16px', fontWeight: 600 }}>{selectedCampaign.name}</h4>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>
              {new Date(selectedCampaign.startDate).toLocaleDateString('vi-VN')} - {new Date(selectedCampaign.endDate).toLocaleDateString('vi-VN')}
            </p>
          </div>
        )}
        
        <div>
          {isStatsLoading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Đang tải...</p>
          ) : stats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>Tổng số loại Voucher</p>
                <p style={{ margin: 0, fontWeight: 700, color: '#6366f1', fontSize: '24px' }}>
                  {stats.totalVouchers}
                </p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>Tổng số lượt đã sử dụng</p>
                <p style={{ margin: 0, fontWeight: 700, color: '#10b981', fontSize: '24px' }}>
                  {stats.totalUsedCount}
                </p>
              </div>
            </div>
          ) : (
             <p style={{ textAlign: 'center', color: '#94a3b8' }}>Không có dữ liệu.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};
