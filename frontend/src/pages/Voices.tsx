import React, { useState } from 'react';
import { Voice } from '../types';
import { api } from '../services/api';
import { VoiceConsentModal } from '../components/VoiceConsentModal';
import { Mic, Plus, Trash2, RefreshCw, UploadCloud, Play, CheckCircle2, AlertCircle, FileAudio } from 'lucide-react';

interface VoicesProps {
  voices: Voice[];
  onRefresh: () => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (open: boolean) => void;
}

export const Voices: React.FC<VoicesProps> = ({
  voices,
  onRefresh,
  isAddModalOpen,
  setIsAddModalOpen,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [language, setLanguage] = useState('vi');
  const [sampleFiles, setSampleFiles] = useState<File[]>([]);

  const [isConsentOpen, setIsConsentOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleStartCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên cho giọng đọc');
      return;
    }
    if (sampleFiles.length === 0) {
      setError('Vui lòng chọn ít nhất một file mẫu âm thanh (.wav, .mp3, .m4a, .flac)');
      return;
    }
    setError(null);
    setIsConsentOpen(true);
  };

  const handleConfirmCreate = async () => {
    setIsConsentOpen(false);
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', name.trim());
    if (description.trim()) formData.append('description', description.trim());
    formData.append('language', language);
    formData.append('consent', 'true');

    // Append all selected files
    sampleFiles.forEach((f) => {
      formData.append('samples', f);
    });

    try {
      await api.createVoice(formData);
      setSuccessMessage(`Đã tạo hồ sơ giọng đọc thành công từ ${sampleFiles.length} file mẫu!`);
      setName('');
      setDescription('');
      setSampleFiles([]);
      setConsentChecked(false);
      setIsAddModalOpen(false);
      onRefresh();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo giọng đọc');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, voiceName: string) => {
    if (!confirm(`Bạn có chắc muốn xóa giọng đọc "${voiceName}" không?`)) return;
    try {
      await api.deleteVoice(id);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRebuild = async (id: string) => {
    try {
      await api.rebuildEmbedding(id);
      alert('Đã tính toán và cập nhật lại vector embedding thành công!');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Giọng Đọc Của Tôi</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
            Tải lên mẫu giọng thu âm (chọn 1 hoặc nhiều file, trên 2 giây) để hệ thống trích xuất âm sắc riêng của bạn.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
          Thêm Giọng Mới
        </button>
      </div>

      {successMessage && (
        <div style={{
          marginBottom: '24px',
          padding: '14px 20px',
          borderRadius: '12px',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#6ee7b7',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Danh Sách Giọng */}
      {voices.length === 0 ? (
        <div className="glass-panel" style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <Mic size={32} color="var(--accent-primary)" />
          </div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Chưa có Giọng Đọc Nào</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '420px', margin: '0 auto 24px auto' }}>
            Bạn chỉ cần thu âm giọng của mình từ 2 giây trở lên (chọn 1 hoặc nhiều file), tải lên để bắt đầu đọc văn bản bằng chính giọng của bạn.
          </p>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-primary">
            <Plus size={16} /> Tạo Giọng Đọc Đầu Tiên Của Bạn
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {voices.map((v) => (
            <div key={v.id} className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
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
                    <Mic size={20} color="#fff" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700' }}>{v.name}</h4>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                      {v.language.toUpperCase()} • Nhân bản giọng nói
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(v.id, v.name)}
                  title="Xóa giọng đọc này"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {v.description && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                  {v.description}
                </p>
              )}

              {/* Trạng thái Embedding */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', marginTop: 'auto' }}>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: v.has_embedding ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  color: v.has_embedding ? '#34d399' : '#f87171'
                }}>
                  {v.has_embedding ? '✓ Đã có Embedding' : '✗ Chưa có Embedding'}
                </span>
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: 'var(--text-dim)'
                }}>
                  {v.model}
                </span>
              </div>

              {/* Thao tác */}
              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <button
                  onClick={() => handleRebuild(v.id)}
                  className="btn-secondary"
                  style={{ flex: 1, fontSize: '12px', justifyContent: 'center' }}
                >
                  <RefreshCw size={13} /> Tạo Lại Embedding
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm Giọng Mới */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 90,
          padding: '16px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '540px',
            width: '100%',
            padding: '32px',
            backgroundColor: '#121829',
            border: '1px solid var(--border-hover)',
            borderRadius: '20px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>+ Thêm Giọng Đọc Mới</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Tải lên 1 hoặc nhiều file ghi âm (từ 2 giây trở lên) để hệ thống trích xuất vector âm sắc đặc trưng.
            </p>

            <form onSubmit={handleStartCreate}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Tên Giọng Đọc *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giọng của tôi, Nguyen Van A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Mô Tả (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Giọng đọc truyền cảm, ấm áp"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Ngôn Ngữ
                </label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                  <option value="vi">Tiếng Việt (Vietnamese)</option>
                  <option value="en">Tiếng Anh (English)</option>
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                  Mẫu Ghi Âm (.wav, .mp3, .m4a, .flac) * (Cho phép chọn nhiều file)
                </label>
                <div style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                  cursor: 'pointer'
                }}>
                  <input
                    type="file"
                    multiple
                    accept=".wav,.mp3,.flac,.m4a,.ogg"
                    id="sample-file-input"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSampleFiles(Array.from(e.target.files));
                      }
                    }}
                  />
                  <label htmlFor="sample-file-input" style={{ cursor: 'pointer', display: 'block' }}>
                    <UploadCloud size={32} color="var(--accent-secondary)" style={{ margin: '0 auto 8px auto' }} />
                    <p style={{ fontSize: '14px', fontWeight: '600' }}>
                      {sampleFiles.length > 0 ? (
                        sampleFiles.length === 1 ? sampleFiles[0].name : `Đã chọn ${sampleFiles.length} file âm thanh`
                      ) : (
                        'Nhấn để chọn file (có thể chọn 1 hoặc nhiều file)'
                      )}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      Hỗ trợ chọn nhiều file để ghép lại thành dữ liệu giọng nói phong phú hơn
                    </p>
                  </label>
                </div>

                {/* Danh sách file đã chọn */}
                {sampleFiles.length > 1 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {sampleFiles.map((f, idx) => (
                      <div key={idx} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                        fontSize: '12px',
                        color: 'var(--text-muted)'
                      }}>
                        <FileAudio size={14} color="var(--accent-primary)" />
                        <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {f.name}
                        </span>
                        <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-dim)', fontSize: '11px' }}>
                          {(f.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div style={{
                  marginBottom: '16px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5',
                  fontSize: '13px'
                }}>
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn-secondary"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Đang xử lý âm thanh...' : 'Tiếp Tục: Xác Nhận Quyền & Tạo Giọng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Xác Nhận Bản Quyền */}
      <VoiceConsentModal
        isOpen={isConsentOpen}
        onClose={() => setIsConsentOpen(false)}
        onConfirm={handleConfirmCreate}
        consentChecked={consentChecked}
        setConsentChecked={setConsentChecked}
      />
    </div>
  );
};
