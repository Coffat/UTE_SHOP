import React, { useState } from 'react';
import { CampaignTab } from '../components/Marketing/CampaignTab';
import { VoucherTab } from '../components/Marketing/VoucherTab';
import { PointsTab } from '../components/Marketing/PointsTab';

export const MarketingManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'vouchers' | 'points'>('campaigns');

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Marketing & Khuyến mãi</h2>
          <p className="admin-page-subtitle">Quản lý Voucher giảm giá và Điểm thưởng khách hàng</p>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--adm-border)' }}>
          <button
            onClick={() => setActiveTab('campaigns')}
            style={{
              flex: 1, padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500,
              background: activeTab === 'campaigns' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: activeTab === 'campaigns' ? '#6366f1' : '#94a3b8',
              borderBottom: activeTab === 'campaigns' ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer', outline: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              transition: 'all 0.2s'
            }}
          >
            Quản lý Chiến dịch
          </button>
          <button
            onClick={() => setActiveTab('vouchers')}
            style={{
              flex: 1, padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500,
              background: activeTab === 'vouchers' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: activeTab === 'vouchers' ? '#6366f1' : '#94a3b8',
              borderBottom: activeTab === 'vouchers' ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer', outline: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              transition: 'all 0.2s'
            }}
          >
            Quản lý Voucher
          </button>
          <button
            onClick={() => setActiveTab('points')}
            style={{
              flex: 1, padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: 500,
              background: activeTab === 'points' ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              color: activeTab === 'points' ? '#6366f1' : '#94a3b8',
              borderBottom: activeTab === 'points' ? '2px solid #6366f1' : '2px solid transparent',
              cursor: 'pointer', outline: 'none', borderTop: 'none', borderLeft: 'none', borderRight: 'none',
              transition: 'all 0.2s'
            }}
          >
            Quản lý Điểm thưởng
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {activeTab === 'campaigns' && <CampaignTab />}
          {activeTab === 'vouchers' && <VoucherTab />}
          {activeTab === 'points' && <PointsTab />}
        </div>
      </div>
    </div>
  );
};
