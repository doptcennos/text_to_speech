import React from 'react';
import { Loader2, XCircle } from 'lucide-react';

interface JobProgressProps {
  progress: number;
  status: string;
  onCancel?: () => void;
}

export const JobProgress: React.FC<JobProgressProps> = ({ progress, status, onCancel }) => {
  return (
    <div className="glass-panel" style={{ padding: '20px', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Loader2 size={18} className="pulse-glow" style={{ animation: 'spin 1.5s linear infinite', color: 'var(--accent-primary)' }} />
          <span style={{ fontSize: '14px', fontWeight: '600' }}>
            {status === 'QUEUED' ? 'Đang xếp hàng đợi xử lý...' : 'Đang tổng hợp giọng nói & điều chế âm sắc...'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontFamily: 'JetBrains Mono', fontWeight: '700', color: 'var(--accent-secondary)' }}>
            {progress}%
          </span>
          {onCancel && (
            <button onClick={onCancel} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
              <XCircle size={14} /> Hủy Bỏ
            </button>
          )}
        </div>
      </div>

      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'var(--accent-gradient)',
          borderRadius: '4px',
          transition: 'width 0.3s ease',
          boxShadow: 'var(--accent-glow)'
        }} />
      </div>
    </div>
  );
};
