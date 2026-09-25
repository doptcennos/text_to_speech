import React from 'react';
import { Mic, Radio, Settings, Volume2, Sparkles, Cpu, Activity, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: 'studio' | 'voices' | 'settings';
  setActiveTab: (tab: 'studio' | 'voices' | 'settings') => void;
  isEngineReady: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, isEngineReady }) => {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 28px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      backgroundColor: 'rgba(10, 13, 20, 0.88)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)'
    }}>
      {/* 1. Logo & Tên ứng dụng */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.45)',
          position: 'relative'
        }}>
          <Volume2 size={24} color="#ffffff" />
          {/* Mini pulse ring */}
          <span style={{
            position: 'absolute',
            inset: '-2px',
            borderRadius: '14px',
            border: '1px solid rgba(139, 92, 246, 0.5)',
            pointerEvents: 'none'
          }} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{
              fontSize: '17px',
              fontWeight: '800',
              letterSpacing: '-0.3px',
              background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textTransform: 'uppercase'
            }}>
              Phòng Thu Giọng Nói AI
            </h1>
            <span style={{
              fontSize: '10px',
              fontWeight: '700',
              padding: '2px 6px',
              borderRadius: '6px',
              background: 'rgba(99, 102, 241, 0.18)',
              color: '#a5b4fc',
              border: '1px solid rgba(99, 102, 241, 0.35)',
              letterSpacing: '0.5px'
            }}>
              PRO v3
            </span>
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '500' }}>
            VieNeu Neural Zero-Shot Voice Cloning & Offline TTS
          </p>
        </div>
      </div>

      {/* 2. Khung Menu Điều Hướng (Navigation Dock) */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 6px',
        backgroundColor: 'rgba(16, 21, 34, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.4)'
      }}>
        {/* TAB 1: PHÒNG THU (ĐIỂM NHẤN TRUNG TÂM) */}
        <button
          onClick={() => setActiveTab('studio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '10px',
            border: activeTab === 'studio' ? '1px solid rgba(139, 92, 246, 0.5)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: activeTab === 'studio' ? '700' : '600',
            color: activeTab === 'studio' ? '#ffffff' : '#94a3b8',
            background: activeTab === 'studio'
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(139, 92, 246, 0.25) 100%)'
              : 'transparent',
            boxShadow: activeTab === 'studio'
              ? '0 0 16px rgba(99, 102, 241, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
              : 'none',
            position: 'relative',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'studio') {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#e2e8f0';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'studio') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }
          }}
        >
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Sparkles
              size={16}
              color={activeTab === 'studio' ? '#c084fc' : '#94a3b8'}
              style={{
                filter: activeTab === 'studio' ? 'drop-shadow(0 0 6px #c084fc)' : 'none'
              }}
            />
          </div>
          <span>Phòng Thu</span>

          {/* Badge STUDIO AI đặc quyền */}
          <span style={{
            fontSize: '9.5px',
            fontWeight: '800',
            letterSpacing: '0.4px',
            padding: '1.5px 5px',
            borderRadius: '4px',
            background: activeTab === 'studio'
              ? 'linear-gradient(90deg, #ec4899, #8b5cf6)'
              : 'rgba(255, 255, 255, 0.08)',
            color: '#ffffff',
            textTransform: 'uppercase',
            boxShadow: activeTab === 'studio' ? '0 0 8px rgba(236, 72, 153, 0.5)' : 'none'
          }}>
            AI
          </span>
        </button>

        {/* TAB 2: GIỌNG CỦA TÔI */}
        <button
          onClick={() => setActiveTab('voices')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'voices' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: activeTab === 'voices' ? '700' : '500',
            color: activeTab === 'voices' ? '#ffffff' : '#94a3b8',
            background: activeTab === 'voices'
              ? 'rgba(99, 102, 241, 0.2)'
              : 'transparent',
            boxShadow: activeTab === 'voices' ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'voices') {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#e2e8f0';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'voices') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }
          }}
        >
          <Mic size={15} color={activeTab === 'voices' ? '#818cf8' : 'currentColor'} />
          <span>Giọng Của Tôi</span>
        </button>

        {/* TAB 3: CÀI ĐẶT */}
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '10px',
            border: activeTab === 'settings' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid transparent',
            cursor: 'pointer',
            fontSize: '13.5px',
            fontWeight: activeTab === 'settings' ? '700' : '500',
            color: activeTab === 'settings' ? '#ffffff' : '#94a3b8',
            background: activeTab === 'settings'
              ? 'rgba(99, 102, 241, 0.2)'
              : 'transparent',
            boxShadow: activeTab === 'settings' ? '0 0 12px rgba(99, 102, 241, 0.2)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'settings') {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.color = '#e2e8f0';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'settings') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#94a3b8';
            }
          }}
        >
          <Settings size={15} color={activeTab === 'settings' ? '#818cf8' : 'currentColor'} />
          <span>Cài Đặt</span>
        </button>
      </nav>

      {/* 3. Trạng Thái AI Engine (Bên Phải Navbar) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: '20px',
          backgroundColor: isEngineReady ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          border: isEngineReady ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
          fontSize: '12px',
          fontWeight: '600',
          color: isEngineReady ? '#34d399' : '#fbbf24'
        }}>
          {/* Pulse LED */}
          <span style={{
            position: 'relative',
            display: 'flex',
            height: '8px',
            width: '8px'
          }}>
            <span style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              backgroundColor: isEngineReady ? '#10b981' : '#f59e0b',
              opacity: 0.75,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />
            <span style={{
              position: 'relative',
              borderRadius: '50%',
              height: '8px',
              width: '8px',
              backgroundColor: isEngineReady ? '#10b981' : '#f59e0b'
            }} />
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Cpu size={13} />
            {isEngineReady ? 'VieNeu Neural Online' : 'Khởi Động Engine...'}
          </span>
        </div>
      </div>
    </header>
  );
};
