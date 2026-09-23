import React, { useState, useEffect } from 'react';
import { TTSJob } from '../types';
import { api } from '../services/api';
import { History as HistoryIcon, Play, Download, Trash2, RotateCw, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface HistoryProps {
  onRegenerate: (text: string, voiceId?: string, emotion?: string) => void;
}

export const History: React.FC<HistoryProps> = ({ onRegenerate }) => {
  const [jobs, setJobs] = useState<TTSJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingAudioUrl, setPlayingAudioUrl] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteAudio = async (audioId?: string) => {
    if (!audioId) return;
    if (!confirm('Bạn có chắc muốn xóa bản ghi âm thanh này không?')) return;
    try {
      await api.deleteAudio(audioId);
      fetchHistory();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <CheckCircle size={12} /> Hoàn thành
          </span>
        );
      case 'PROCESSING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Clock size={12} /> Đang xử lý
          </span>
        );
      case 'QUEUED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc' }}>
            <Clock size={12} /> Đang chờ
          </span>
        );
      case 'FAILED':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
            <XCircle size={12} /> Thất bại
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Lịch Sử Sinh Giọng Nói</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Toàn bộ danh sách các văn bản đã được chuyển thành giọng nói trong hệ thống.
          </p>
        </div>
        <button onClick={fetchHistory} className="btn-secondary" style={{ fontSize: '13px' }}>
          <RotateCw size={14} /> Làm Mới
        </button>
      </div>

      {playingAudioUrl && (
        <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600' }}>Đang phát nghe thử:</span>
          <audio controls autoPlay src={playingAudioUrl} style={{ height: '36px', flex: 1 }} />
          <button onClick={() => setPlayingAudioUrl(null)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
            Đóng
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Đang tải lịch sử...
        </div>
      ) : jobs.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center' }}>
          <HistoryIcon size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Chưa có lịch sử tạo âm thanh</h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Các file âm thanh sau khi tạo tại Phòng Thu sẽ tự động được lưu trữ tại đây.
          </p>
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '14px 18px', color: 'var(--text-dim)', fontWeight: '600' }}>Thời Gian</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-dim)', fontWeight: '600' }}>Văn Bản</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-dim)', fontWeight: '600' }}>Giọng Đọc</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-dim)', fontWeight: '600' }}>Cảm Xúc</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-dim)', fontWeight: '600' }}>Định Dạng</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-dim)', fontWeight: '600' }}>Trạng Thái</th>
                <th style={{ padding: '14px 18px', color: 'var(--text-dim)', fontWeight: '600', textAlign: 'right' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const dateStr = new Date(job.created_at).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                });
                return (
                  <tr key={job.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap', color: 'var(--text-dim)', fontFamily: 'JetBrains Mono' }}>
                      {dateStr}
                    </td>
                    <td style={{ padding: '14px 18px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.text}>
                      {job.text}
                    </td>
                    <td style={{ padding: '14px 18px', fontWeight: '500' }}>
                      {job.voice_name || 'Mặc định'}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
                        {job.emotion}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textTransform: 'uppercase', fontFamily: 'JetBrains Mono', color: 'var(--text-dim)' }}>
                      {job.output_format}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {getStatusBadge(job.status)}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {job.status === 'COMPLETED' && job.audio_url && (
                          <>
                            <button
                              onClick={() => setPlayingAudioUrl(job.audio_url || null)}
                              title="Nghe thử"
                              style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '4px' }}
                            >
                              <Play size={16} />
                            </button>
                            {job.mp3_url && (
                              <a
                                href={job.mp3_url}
                                download
                                title="Tải về file MP3"
                                style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', padding: '4px' }}
                              >
                                <Download size={16} />
                              </a>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => onRegenerate(job.text, job.voice_id, job.emotion)}
                          title="Tạo lại"
                          style={{ background: 'none', border: 'none', color: 'var(--accent-secondary)', cursor: 'pointer', padding: '4px' }}
                        >
                          <RotateCw size={15} />
                        </button>
                        {job.audio_id && (
                          <button
                            onClick={() => handleDeleteAudio(job.audio_id)}
                            title="Xóa âm thanh này"
                            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: '4px' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
