import React from 'react';
import { ShieldAlert, Check } from 'lucide-react';

interface VoiceConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  consentChecked: boolean;
  setConsentChecked: (checked: boolean) => void;
}

export const VoiceConsentModal: React.FC<VoiceConsentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  consentChecked,
  setConsentChecked,
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '16px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '500px',
        width: '100%',
        padding: '28px',
        backgroundColor: '#121829',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '20px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--error)'
          }}>
            <ShieldAlert size={24} />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Xác Nhận Quyền Sở Hữu Giọng Nói</h3>
        </div>

        <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px' }}>
          Hệ thống sử dụng công nghệ trích xuất đặc trưng âm sắc (Voice Cloning). Để tuân thủ chính sách bản quyền và tiêu chuẩn đạo đức AI, vui lòng xác nhận bạn có toàn quyền sử dụng mẫu giọng thu âm này.
        </p>

        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                accentColor: 'var(--accent-primary)',
                marginTop: '3px'
              }}
            />
            <span style={{ fontSize: '13px', lineHeight: '1.5', fontWeight: '500' }}>
              Tôi xác nhận rằng tôi là chủ sở hữu hoặc đã được sự cho phép hợp pháp để sử dụng mẫu giọng nói này.
              <br />
              <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                (I confirm that I own this voice or have permission to use this voice.)
              </span>
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn-secondary">
            Hủy Bỏ
          </button>
          <button
            onClick={onConfirm}
            disabled={!consentChecked}
            className="btn-primary"
            style={{ minWidth: '150px' }}
          >
            <Check size={16} /> Đồng Ý & Tạo Giọng
          </button>
        </div>
      </div>
    </div>
  );
};
