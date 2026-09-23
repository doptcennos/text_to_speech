import React, { useState, useEffect } from 'react';
import { SystemInfo } from '../types';
import { api } from '../services/api';
import { Cpu, HardDrive, Zap, CheckCircle2, DownloadCloud, RefreshCw, Sliders, Shield } from 'lucide-react';

export const Settings: React.FC = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [defaultSpeed, setDefaultSpeed] = useState('1.0');
  const [defaultEmotion, setDefaultEmotion] = useState('Neutral');
  const [defaultFormat, setDefaultFormat] = useState('mp3');
  const [bitrate, setBitrate] = useState('192k');

  const fetchSysInfo = async () => {
    try {
      setLoading(true);
      const data = await api.getSystemInfo();
      setSystemInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSysInfo();
  }, []);

  const handleDownloadModel = async () => {
    setDownloading(true);
    setMessage(null);
    try {
      const res = await api.downloadModel();
      setMessage(res.message);
      await fetchSysInfo();
    } catch (err: any) {
      setMessage(err.message || 'Lỗi khi tải và nạp mô hình');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Cài Đặt & Thông Số Hệ Thống</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Thông số phần cứng, mô hình trí tuệ nhân tạo và tùy chỉnh hệ thống cục bộ.
          </p>
        </div>
        <button onClick={fetchSysInfo} className="btn-secondary" style={{ fontSize: '13px' }}>
          <RefreshCw size={14} /> Làm Mới Thông Số
        </button>
      </div>

      {message && (
        <div style={{
          marginBottom: '24px',
          padding: '14px 20px',
          borderRadius: '12px',
          backgroundColor: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#a5b4fc',
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Thông tin phần cứng */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--accent-secondary)" /> Phần Cứng & Môi Trường Máy Tính
          </h3>

          {loading ? (
            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Đang kiểm tra phần cứng...</p>
          ) : systemInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bộ Xử Lý (CPU)</span>
                <span style={{ fontWeight: '600' }}>{systemInfo.cpu}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Bộ Nhớ RAM (Khả dụng / Tổng)</span>
                <span style={{ fontWeight: '600', fontFamily: 'JetBrains Mono' }}>
                  {systemInfo.ram_available_gb} GB / {systemInfo.ram_total_gb} GB
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Card Đồ Họa (GPU)</span>
                <span style={{ fontWeight: '600', color: systemInfo.cuda_available ? 'var(--accent-primary)' : 'inherit' }}>
                  {systemInfo.gpu || 'Không có (Chế độ CPU)'}
                </span>
              </div>
              {systemInfo.vram_total_mb && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bộ Nhớ VRAM (Đã dùng / Tổng)</span>
                  <span style={{ fontWeight: '600', fontFamily: 'JetBrains Mono' }}>
                    {systemInfo.vram_used_mb} MB / {systemInfo.vram_total_mb} MB
                  </span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Công Nghệ NVIDIA CUDA</span>
                <span style={{ fontWeight: '600' }}>
                  {systemInfo.cuda_available ? `Đang hoạt động (${systemInfo.cuda_version || '11.x+'})` : 'Tắt'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phiên Bản PyTorch</span>
                <span style={{ fontWeight: '600', fontFamily: 'JetBrains Mono' }}>{systemInfo.pytorch_version}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Ổ Đĩa Còn Trống</span>
                <span style={{ fontWeight: '600', fontFamily: 'JetBrains Mono' }}>{systemInfo.disk_free_gb} GB</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Trạng thái Mô hình */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="var(--accent-primary)" /> Trạng Thái Mô Hình TTS
          </h3>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: systemInfo?.model_status === 'ready' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            border: `1px solid ${systemInfo?.model_status === 'ready' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <CheckCircle2 size={16} color={systemInfo?.model_status === 'ready' ? 'var(--success)' : 'var(--warning)'} />
              <span style={{ fontSize: '14px', fontWeight: '700' }}>
                {systemInfo?.model_status === 'ready' ? 'Mô hình đã sẵn sàng' : 'Chưa tải mô hình'}
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {systemInfo?.model_status === 'ready'
                ? 'Mô hình Neural Voice Cloning đã được nạp sẵn sàng trong bộ nhớ RAM worker, không cần tải lại.'
                : 'Mô hình chưa được nạp. Nhấn nút bên dưới để tải và nạp vào bộ nhớ.'}
            </p>
          </div>

          <button
            onClick={handleDownloadModel}
            disabled={downloading}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <DownloadCloud size={16} />
            {downloading ? 'Đang tải & nạp mô hình...' : 'Tải & Nạp Mô Hình'}
          </button>

          {/* Thông số Động cơ */}
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Thông Số Động Cơ
            </span>
            <div style={{ marginTop: '10px', fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <div>• Động cơ: <b>{systemInfo?.tts_engine}</b></div>
              <div>• Kích thước vector giọng nói: <b>512 chiều (embedding.bin)</b></div>
              <div>• Tần số lấy mẫu âm thanh: <b>24,000 Hz / 44,100 Hz</b></div>
              <div>• Chế độ suy luận: <b>Hoàn toàn Cục bộ & Offline</b></div>
            </div>
          </div>
        </div>

      </div>

      {/* Cài đặt Mặc định */}
      <div className="glass-panel" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--accent-secondary)" /> Tùy Chỉnh Cấu Hình Mặc Định
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Tốc Độ Mặc Định
            </label>
            <select value={defaultSpeed} onChange={(e) => setDefaultSpeed(e.target.value)}>
              <option value="0.8">0.8x (Chậm)</option>
              <option value="1.0">1.0x (Tiêu chuẩn)</option>
              <option value="1.2">1.2x (Nhanh)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Cảm Xúc Mặc Định
            </label>
            <select value={defaultEmotion} onChange={(e) => setDefaultEmotion(e.target.value)}>
              <option value="Neutral">Tự nhiên / Chuẩn mực</option>
              <option value="Friendly">Thân thiện / Cởi mở</option>
              <option value="Happy">Vui vẻ</option>
              <option value="Serious">Nghiêm túc</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Định Dạng Mặc Định
            </label>
            <select value={defaultFormat} onChange={(e) => setDefaultFormat(e.target.value)}>
              <option value="mp3">MP3 (Nhẹ & Tiện dụng)</option>
              <option value="wav">WAV (Chất lượng gốc)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Bitrate MP3
            </label>
            <select value={bitrate} onChange={(e) => setBitrate(e.target.value)}>
              <option value="128k">128 kbps</option>
              <option value="192k">192 kbps (Chuẩn)</option>
              <option value="256k">256 kbps</option>
              <option value="320k">320 kbps (Chất lượng cao)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
