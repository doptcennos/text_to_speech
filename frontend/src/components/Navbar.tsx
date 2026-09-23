import React from 'react';
import { Mic, Radio, History, Settings, Volume2 } from 'lucide-react';

interface NavbarProps {
  activeTab: 'studio' | 'voices' | 'history' | 'settings';
  setActiveTab: (tab: 'studio' | 'voices' | 'history' | 'settings') => void;
  isEngineReady: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isEngineReady }) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 32px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(12px)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Logo & Tiêu đề thương hiệu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--accent-glow)'
        }}>
          <Volume2 size={24} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            PHÒNG THU GIỌNG NÓI <span style={{ color: 'var(--accent-secondary)', fontSize: '14px', fontWeight: '600' }}>AI</span>
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)', letterSpacing: '0.2px' }}>
            Nhân Bản Giọng Nói & Text-to-Speech Offline
          </p>
        </div>
      </div>

      {/* Các Tab Điều Hướng */}
      <nav style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'studio', label: 'Phòng Thu', icon: Radio },
          { id: 'voices', label: 'Giọng Của Tôi', icon: Mic },
          { id: 'history', label: 'Lịch Sử', icon: History },
          { id: 'settings', label: 'Cài Đặt', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#fff' : 'var(--text-muted)',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                outline: isActive ? '1px solid rgba(99, 102, 241, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={16} color={isActive ? 'var(--accent-primary)' : 'currentColor'} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Trạng thái Động Cơ AI */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <span style={{
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          backgroundColor: isEngineReady ? 'var(--success)' : 'var(--warning)',
          boxShadow: isEngineReady ? '0 0 10px var(--success)' : 'none'
        }} />
        <span style={{ color: 'var(--text-muted)' }}>
          {isEngineReady ? 'Mô hình AI sẵn sàng' : 'Đang khởi tạo...'}
        </span>
      </div>
    </header>
  );
};
