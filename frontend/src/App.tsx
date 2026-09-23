import React, { useState, useEffect } from 'react';
import { Voice } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { Studio } from './pages/Studio';
import { Voices } from './pages/Voices';
import { History } from './pages/History';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'studio' | 'voices' | 'history' | 'settings'>('studio');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [isEngineReady, setIsEngineReady] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchVoices = async () => {
    try {
      const data = await api.getVoices();
      setVoices(data);
    } catch (err) {
      console.error('Không thể tải danh sách giọng đọc:', err);
    }
  };

  const checkHealth = async () => {
    try {
      const res = await api.getHealth();
      setIsEngineReady(res.tts_engine === 'ready');
    } catch (err) {
      setIsEngineReady(false);
    }
  };

  useEffect(() => {
    fetchVoices();
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRegenerateFromHistory = (text: string, voiceId?: string, emotion?: string) => {
    setActiveTab('studio');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isEngineReady={isEngineReady}
      />

      <main style={{ flex: 1 }}>
        {activeTab === 'studio' && (
          <Studio
            voices={voices}
            onOpenVoiceModal={() => setIsAddModalOpen(true)}
          />
        )}
        {activeTab === 'voices' && (
          <Voices
            voices={voices}
            onRefresh={fetchVoices}
            isAddModalOpen={isAddModalOpen}
            setIsAddModalOpen={setIsAddModalOpen}
          />
        )}
        {activeTab === 'history' && (
          <History
            onRegenerate={handleRegenerateFromHistory}
          />
        )}
        {activeTab === 'settings' && (
          <Settings />
        )}
      </main>

      <footer style={{
        padding: '20px 32px',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        fontSize: '12px',
        color: 'var(--text-dim)',
        backgroundColor: 'rgba(10, 13, 20, 0.95)'
      }}>
        Hệ Thống Text-to-Speech & Nhân Bản Giọng Nói Chạy Cục Bộ (Offline) • Docker trên Ubuntu 22.04
      </footer>
    </div>
  );
};

export default App;
