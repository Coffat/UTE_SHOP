import React, { useState, useEffect } from 'react';
import { CrudModal, Modal, FormField, FormInput, FormSelect, FormTextarea } from '../AdminUI';

interface UserPointInfo {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  points: number;
}

interface PointLedger {
  _id: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
  createdBy?: { fullName: string; email: string };
}

export const PointsTab: React.FC = () => {
  const [users, setUsers] = useState<UserPointInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Điều chỉnh điểm
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPointInfo | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    action: 'ADD',
    points: '',
    description: '',
  });

  // Slideover Lịch sử điểm
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyLedgers, setHistoryLedgers] = useState<PointLedger[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    fetchUsersPoints();
  }, []);

  const fetchUsersPoints = async () => {
    try {
      const res = await fetch('/api/v1/admin/users/points', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('Error fetching users points:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    try {
      const payload = {
        action: adjustForm.action,
        points: Number(adjustForm.points),
        description: adjustForm.description,
      };

      const res = await fetch(`/api/v1/admin/users/${selectedUser._id}/points/adjust`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsAdjustModalOpen(false);
        fetchUsersPoints(); // Refresh list
        setAdjustForm({ action: 'ADD', points: '', description: '' });
      } else {
        alert(data.message || 'Lỗi khi điều chỉnh điểm');
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
    }
  };

  const openHistory = async (user: UserPointInfo) => {
    setSelectedUser(user);
    setIsHistoryOpen(true);
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user._id}/points`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setHistoryLedgers(data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#fff', margin: 0 }}>Tra cứu & Điều chỉnh điểm</h2>
      </div>

      <div className="admin-table-wrap" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Khách hàng</th>
              <th>Số điện thoại</th>
              <th>Email</th>
              <th>Điểm hiện tại</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Đang tải...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Chưa có dữ liệu khách hàng.</td></tr>
            ) : (
              users.map((u) => (
                <tr key={u._id} className="admin-table-row">
                  <td style={{ fontWeight: 500, color: '#fff' }}>{u.fullName}</td>
                  <td style={{ color: '#e2e8f0' }}>{u.phone}</td>
                  <td style={{ color: '#94a3b8' }}>{u.email}</td>
                  <td style={{ fontWeight: 700, color: '#6366f1', fontFamily: 'var(--adm-mono)' }}>{u.points.toLocaleString()} đ</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => openHistory(u)}
                        className="admin-action-glass-btn"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Lịch sử
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(u); setIsAdjustModalOpen(true); }}
                        className="admin-action-glass-btn"
                        style={{ padding: '6px 12px', fontSize: '12px', color: '#6366f1', borderColor: 'rgba(99, 102, 241, 0.3)' }}
                      >
                        Điều chỉnh
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
        isOpen={isAdjustModalOpen}
        mode="create"
        title="Điều chỉnh điểm"
        onClose={() => setIsAdjustModalOpen(false)}
        onSubmit={handleAdjustPoints}
        submitLabel="Xác nhận"
      >
        {selectedUser && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>Khách hàng</p>
            <p style={{ margin: '0 0 12px', fontWeight: 600, color: '#fff' }}>{selectedUser.fullName} ({selectedUser.phone})</p>
            <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#94a3b8' }}>Điểm hiện tại</p>
            <p style={{ margin: 0, fontWeight: 700, color: '#6366f1', fontSize: '16px' }}>{selectedUser.points.toLocaleString()}</p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <FormField label="Loại điều chỉnh">
            <FormSelect value={adjustForm.action} onChange={e => setAdjustForm({...adjustForm, action: e.target.value})}>
              <option value="ADD">Cộng (+)</option>
              <option value="SUBTRACT">Trừ (-)</option>
            </FormSelect>
          </FormField>
          <FormField label="Số điểm" required>
            <FormInput required type="number" min="1" value={adjustForm.points} onChange={e => setAdjustForm({...adjustForm, points: e.target.value})} placeholder="Nhập số điểm..." />
          </FormField>
        </div>

        <FormField label="Lý do điều chỉnh" required>
          <FormTextarea required value={adjustForm.description} onChange={e => setAdjustForm({...adjustForm, description: e.target.value})} placeholder="VD: Tặng điểm sinh nhật..." />
        </FormField>
      </CrudModal>

      <Modal
        isOpen={isHistoryOpen}
        title="Lịch sử điểm"
        onClose={() => setIsHistoryOpen(false)}
        size="lg"
      >
        {selectedUser && (
          <div style={{ paddingBottom: '16px', marginBottom: '16px', borderBottom: '1px solid var(--adm-border)' }}>
            <h4 style={{ margin: '0 0 4px', color: '#fff', fontSize: '16px', fontWeight: 600 }}>{selectedUser.fullName}</h4>
            <p style={{ margin: 0, color: '#6366f1', fontWeight: 600 }}>{selectedUser.points.toLocaleString()} điểm</p>
          </div>
        )}
        
        <div>
          {isHistoryLoading ? (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Đang tải...</p>
          ) : historyLedgers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Chưa có giao dịch điểm nào.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {historyLedgers.map((ledger) => {
                const isPositive = ['EARNED', 'REFUNDED', 'ADMIN_ADJUST'].includes(ledger.type) && ledger.amount > 0;
                return (
                  <div key={ledger._id} style={{ 
                    padding: '12px 16px', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--adm-border)', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <p style={{ margin: '0 0 6px', fontWeight: 500, color: '#fff', fontSize: '14px' }}>{ledger.description}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(ledger.createdAt).toLocaleString('vi-VN')}</span>
                        <span style={{ 
                          fontSize: '11px', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          background: 'rgba(255,255,255,0.05)', 
                          color: '#e2e8f0',
                          fontWeight: 500
                        }}>
                          {ledger.type}
                        </span>
                        {ledger.type === 'ADMIN_ADJUST' && ledger.createdBy && (
                          <span style={{ fontSize: '11px', color: '#6366f1' }}>Bởi: {ledger.createdBy.fullName}</span>
                        )}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: isPositive ? '#10b981' : '#f43f5e', fontFamily: 'var(--adm-mono)', fontSize: '15px' }}>
                      {isPositive ? '+' : '-'}{Math.abs(ledger.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

