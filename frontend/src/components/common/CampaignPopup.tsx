import React, { useEffect, useState } from 'react';
import { resolveAssetUrl } from '../../admin/services/adminUpload.api';

interface CampaignPopupData {
  _id: string;
  name: string;
  bannerUrl: string;
}

export const CampaignPopup: React.FC = () => {
  const [campaign, setCampaign] = useState<CampaignPopupData | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if the user has already closed the popup in this session
    const hasClosed = sessionStorage.getItem('hasClosedCampaignPopup');
    if (hasClosed) return;

    const fetchPopup = async () => {
      try {
        const res = await fetch('/api/v1/campaigns/active-popup');
        const data = await res.json();
        
        if (data.success && data.data && data.data.length > 0) {
          // Find the first campaign that actually has a banner URL
          const validCampaign = data.data.find((c: any) => c.bannerUrl);
          if (validCampaign) {
            setCampaign(validCampaign);
            setIsOpen(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch campaign popup:', error);
      }
    };

    fetchPopup();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('hasClosedCampaignPopup', 'true');
  };

  if (!isOpen || !campaign) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px'
    }}>
      <div style={{
        position: 'relative',
        backgroundColor: '#1e1e2d',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        maxWidth: '500px',
        width: '100%',
        animation: 'popupIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <button 
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            lineHeight: 1,
            zIndex: 10,
            transition: 'background 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
        >
          &times;
        </button>
        
        <img 
          src={resolveAssetUrl(campaign.bannerUrl)} 
          alt={campaign.name} 
          style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'contain' }}
        />
      </div>

      <style>{`
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};
