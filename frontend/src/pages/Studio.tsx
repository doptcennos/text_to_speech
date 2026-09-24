import React, { useState, useEffect, useRef } from 'react';
import { Voice, TTSJob, SpeakerMappingItem } from '../types';
import { api } from '../services/api';
import { AudioPlayer } from '../components/AudioPlayer';
import { MultiSpeakerEditor } from '../components/MultiSpeakerEditor';
import { JobProgress } from '../components/JobProgress';
import {
  Wand2,
  Sliders,
  Play,
  Volume2,
  PlusCircle,
  Clock,
  Sparkles,
  Smile,
  Wind,
  Layers,
  Mic
} from 'lucide-react';

interface StudioProps {
  voices: Voice[];
  onOpenVoiceModal: () => void;
}

const EMOTIONS = [
  { id: 'Neutral', label: 'Tự nhiên / Chuẩn mực' },
  { id: 'Happy', label: 'Vui vẻ / Tươi cười' },
  { id: 'Excited', label: 'Hào hứng / Sôi nổi' },
  { id: 'Sad', label: 'U sầu / Trầm lắng' },
  { id: 'Angry', label: 'Tức giận / Dứt khoát' },
  { id: 'Calm', label: 'Điềm tĩnh / Nhẹ nhàng' },
  { id: 'Friendly', label: 'Thân thiện / Cởi mở' },
  { id: 'Serious', label: 'Nghiêm túc / Chuyên nghiệp' },
  { id: 'Confident', label: 'Tự tin / Quyết đoán' },
  { id: 'Shy', label: 'Ngại ngùng / Rụt rè' },
  { id: 'Funny', label: 'Hài hước / Dí dỏm' },
  { id: 'Warm', label: 'Ấm áp / Truyền cảm' },
  { id: 'Sarcastic', label: 'Mỉa mai / Châm biếm' },
  { id: 'Whisper', label: 'Thì thầm' }
];

const EXPRESSION_GROUPS = [
  {
    name: 'Ngắt Nghỉ & Nhịp Điệu',
    color: '#38bdf8',
    icon: Clock,
    tags: [
      { tag: '[nghỉ 300ms]', label: 'Nghỉ 300ms', desc: 'Khoảng dừng ngắn tự nhiên giữa cụm từ' },
      { tag: '[nghỉ 500ms]', label: 'Nghỉ 500ms', desc: 'Khoảng dừng tiêu chuẩn hết câu' },
      { tag: '[nghỉ 1s]', label: 'Nghỉ 1 giây', desc: 'Khoảng dừng dài chuyển ý hoặc suy ngẫm' },
      { tag: '[ngập ngừng]', label: 'Ngập ngừng...', desc: 'Ngập ngừng, do dự trong lời nói' },
      { tag: '[đọc chậm]', label: 'Đọc chậm', desc: 'Nói chậm rãi, thong thả' },
      { tag: '[đọc nhanh]', label: 'Đọc nhanh', desc: 'Nói nhanh, dồn dập' },
      { tag: '[nhấn mạnh]', label: 'Nhấn mạnh', desc: 'Nhấn mạnh dứt khoát từng chữ' },
    ]
  },
  {
    name: 'Hơi Thở & Tự Nhiên',
    color: '#a855f7',
    icon: Wind,
    tags: [
      { tag: '[thở dài]', label: 'Thở dài', desc: 'Tiếng thở dài nhẹ nhàng' },
      { tag: '[hít sâu]', label: 'Hít sâu', desc: 'Lấy hơi trước câu nói cảm xúc' },
      { tag: '[hắng giọng]', label: 'Hắng giọng', desc: 'E hèm chuẩn bị nói' },
    ]
  },
  {
    name: 'Cảm Xúc & Nụ Cười',
    color: '#ec4899',
    icon: Smile,
    tags: [
      { tag: '[cười]', label: 'Tiếng cười', desc: 'Chèn tiếng cười tươi Haha' },
      { tag: '[cười mỉm]', label: 'Cười mỉm', desc: 'Giọng cười nhẹ, tươi tắn' },
      { tag: '[thì thầm]', label: 'Thì thầm', desc: 'Nói nhỏ nhẹ, bí mật' },
      { tag: '[hào hứng]', label: 'Hào hứng', desc: 'Giọng phấn khởi, đầy năng lượng' },
      { tag: '[ấm áp]', label: 'Ấm áp', desc: 'Giọng truyền cảm, êm dịu' },
      { tag: '[xúc động]', label: 'Xúc động', desc: 'Giọng nghẹn ngào, lắng đọng' },
      { tag: '[ngạc nhiên]', label: 'Ngạc nhiên', desc: 'Lên giọng bất ngờ thảng thốt' },
      { tag: '[nghiêm túc]', label: 'Nghiêm túc', desc: 'Giọng đĩnh đạc, chắc nịch' },
    ]
  }
];

export const Studio: React.FC<StudioProps> = ({ voices, onOpenVoiceModal }) => {
  const [text, setText] = useState('Xin chào mọi người! Chào mừng đến với hệ thống Text-to-Speech chạy cục bộ.');
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [emotion, setEmotion] = useState('Friendly');
  const [emotionIntensity, setEmotionIntensity] = useState(1.0);
  const [speed, setSpeed] = useState(1.0);
  const [pitch, setPitch] = useState(0.0);
  const [outputFormat, setOutputFormat] = useState<'mp3' | 'wav'>('mp3');

  const [isMultiSpeaker, setIsMultiSpeaker] = useState(false);
  const [readSpeakerNames, setReadSpeakerNames] = useState(false);
  const [speakers, setSpeakers] = useState<SpeakerMappingItem[]>([]);

  const [activeJob, setActiveJob] = useState<TTSJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (voices.length > 0 && !selectedVoiceId) {
      setSelectedVoiceId(voices[0].id);
    }
  }, [voices, selectedVoiceId]);

  useEffect(() => {
    if (isMultiSpeaker && speakers.length === 0 && voices.length >= 2) {
      setSpeakers([
        { speaker_name: voices[0].name, voice_id: voices[0].id, emotion: 'Friendly', speed: 1.0, pitch: 0.0 },
        { speaker_name: voices[1].name, voice_id: voices[1].id, emotion: 'Warm', speed: 1.0, pitch: 0.0 },
      ]);
    }
  }, [isMultiSpeaker, voices]);

  useEffect(() => {
    let timer: any;
    if (activeJob && (activeJob.status === 'QUEUED' || activeJob.status === 'PROCESSING')) {
      timer = setInterval(async () => {
        try {
          const updated = await api.getJob(activeJob.id);
          setActiveJob(updated);
          if (updated.status === 'COMPLETED' || updated.status === 'FAILED' || updated.status === 'CANCELLED') {
            clearInterval(timer);
          }
        } catch (err) {
          console.error('Error polling job:', err);
        }
      }, 800);
    }
    return () => clearInterval(timer);
  }, [activeJob]);

  const insertTag = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => prev + ' ' + tag + ' ');
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = text;
    const selected = current.substring(start, end);

    const inserted = selected ? (tag + ' ' + selected) : (tag + ' ');
    const nextText = current.substring(0, start) + inserted + current.substring(end);
    setText(nextText);

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + inserted.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 10);
  };

  const insertSpeakerTurn = (speakerName: string) => {
    const textarea = textareaRef.current;
    const template = '\n\n' + speakerName + ':\n[ấm áp] ';
    if (!textarea) {
      setText((prev) => prev.trim() + template);
      return;
    }
    const start = textarea.selectionStart;
    const current = text;
    const prefix = start > 0 && current[start - 1] !== '\n' ? '\n\n' : '\n';
    const toInsert = prefix + speakerName + ':\n[ấm áp] ';
    const nextText = current.substring(0, start) + toInsert + current.substring(start);
    setText(nextText);

    setTimeout(() => {
      textarea.focus();
      const nextPos = start + toInsert.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 10);
  };

  const applySampleScript = () => {
    const spk1 = speakers[0]?.speaker_name || (voices[0] ? voices[0].name : 'Thùy Tiên - Linh (Thực tập sinh)');
    const spk2 = speakers[1]?.speaker_name || (voices[1] ? voices[1].name : 'Thùy Tiên - Chị Mai (HR)');
    const script = spk1 + ':\n' +
      '[nghỉ 300ms] Em chào chị Mai ạ! [cười] [nghỉ 500ms] Hôm nay là ngày đầu tiên em đi làm, [hào hứng] em cảm thấy rất vui và hào hứng!\n\n' +
      spk2 + ':\n' +
      '[ấm áp] Chào em Linh nhé! [cười mỉm] Chúc mừng em đã chính thức gia nhập công ty! [nghỉ 500ms] [thì thầm] Đừng lo lắng quá, các anh chị phòng mình thân thiện lắm.\n\n' +
      spk1 + ':\n' +
      '[xúc động] Dạ vâng, [ấm áp] em cảm ơn chị Mai rất nhiều ạ!';
    setText(script);
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Vui lòng nhập nội dung văn bản cần đọc.');
      return;
    }

    if (!isMultiSpeaker && !selectedVoiceId) {
      setError('Vui lòng chọn một giọng đọc.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload: any = {
        text,
        voice_id: selectedVoiceId || (voices[0] ? voices[0].id : ''),
        emotion,
        emotion_intensity: emotionIntensity,
        speed,
        pitch,
        output_format: outputFormat,
        is_multi_speaker: isMultiSpeaker,
        multi_speaker: isMultiSpeaker,
        read_speaker_names: readSpeakerNames
      };

      if (isMultiSpeaker) {
        payload.speaker_mapping = JSON.stringify(speakers);
        payload.speakers = speakers;
      }

      const res = await api.generateSpeech(payload);
      setActiveJob({
        id: res.job_id,
        status: res.status as any,
        progress: res.progress,
        text,
        voice_id: selectedVoiceId,
        emotion,
        speed,
        output_format: outputFormat,
        created_at: new Date().toISOString()
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể gửi yêu cầu tạo giọng nói. Vui lòng kiểm tra lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
          Phòng Thu Giọng Nói AI
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Chuyển văn bản thành giọng nói tự nhiên, nhân bản giọng nói theo thời gian thực 100% Offline
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>

        {/* Cột Trái: Trình Soạn Thảo Văn Bản & Biểu Thức */}
        <div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <label style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Volume2 size={16} color="var(--accent-secondary)" /> Nội Dung Cần Đọc
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsMultiSpeaker(!isMultiSpeaker)}
                  style={{
                    background: isMultiSpeaker ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: isMultiSpeaker ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                    color: isMultiSpeaker ? '#fff' : 'var(--text-muted)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Layers size={14} color={isMultiSpeaker ? '#818cf8' : undefined} />
                  {isMultiSpeaker ? '✓ Chế Độ Đối Thoại Nhiều Giọng' : '+ Bật Đối Thoại Đa Giọng'}
                </button>

                <button
                  type="button"
                  onClick={() => setReadSpeakerNames(!readSpeakerNames)}
                  title="Bật để AI đọc cả tên nhân vật (Ví dụ: 'Linh (TTS Marketing): ...'). Tắt để AI chỉ lồng tiếng câu thoại mà không đọc tên nhãn."
                  style={{
                    background: readSpeakerNames ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    border: readSpeakerNames ? '1px solid #22c55e' : '1px solid var(--border-color)',
                    color: readSpeakerNames ? '#4ade80' : 'var(--text-muted)',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s'
                  }}
                >
                  <Volume2 size={14} color={readSpeakerNames ? '#4ade80' : undefined} />
                  {readSpeakerNames ? '✓ Đọc Cả Tên Người Thoại: BẬT' : 'Đọc Cả Tên Người Thoại: TẮT'}
                </button>
              </div>
            </div>

            {/* Khung nhập văn bản chính */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Nhập nội dung văn bản bạn muốn đọc tại đây, hoặc nhấp vào các nút biểu thức bên dưới để chèn cảm xúc vào đúng vị trí con trỏ..."
              style={{ minHeight: '190px', fontSize: '15px', lineHeight: '1.6' }}
            />

            {/* Chèn nhanh nhân vật khi ở chế độ đa thoại */}
            {isMultiSpeaker && speakers.length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: 'rgba(99, 102, 241, 0.07)',
                borderRadius: '8px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px'
              }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#818cf8' }}>
                  Chèn lời thoại nhân vật:
                </span>
                {speakers.map((spk, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => insertSpeakerTurn(spk.speaker_name)}
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.35)',
                      color: '#c7d2fe',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    + Thoại: <strong>{spk.speaker_name}</strong>
                  </button>
                ))}
              </div>
            )}

            {/* Bảng Biểu Thức Truyền Cảm Phân Nhóm */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Sparkles size={14} color="#fbbf24" />
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                  Chèn Nhanh Biểu Thức Truyền Cảm & Ngắt Nhịp (Chèn tại vị trí con trỏ):
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {EXPRESSION_GROUPS.map((group) => {
                  const Icon = group.icon;
                  return (
                    <div
                      key={group.name}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', width: '170px', flexShrink: 0 }}>
                        <Icon size={13} color={group.color} />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: group.color }}>
                          {group.name}:
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', flex: 1 }}>
                        {group.tags.map((t) => (
                          <button
                            key={t.tag}
                            type="button"
                            title={t.desc}
                            onClick={() => insertTag(t.tag)}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-color)',
                              color: '#f1f5f9',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)';
                              e.currentTarget.style.borderColor = group.color;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'var(--border-color)';
                            }}
                          >
                            <span style={{ color: group.color, fontFamily: 'JetBrains Mono', fontSize: '10px' }}>
                              {t.tag}
                            </span>
                            <span style={{ color: 'var(--text-dim)', fontSize: '10px' }}>({t.label})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cài đặt Đối Thoại Nhiều Người */}
            {isMultiSpeaker && (
              <MultiSpeakerEditor
                speakers={speakers}
                setSpeakers={setSpeakers}
                availableVoices={voices}
                onInsertSpeakerTurn={insertSpeakerTurn}
                onApplySampleScript={applySampleScript}
              />
            )}

            {error && (
              <div style={{
                marginTop: '16px',
                padding: '12px 16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '13px'
              }}>
                {error}
              </div>
            )}

            {/* Nút Tạo Giọng Nói */}
            <button
              onClick={handleGenerate}
              disabled={isSubmitting || (activeJob?.status === 'QUEUED' || activeJob?.status === 'PROCESSING')}
              className="btn-primary"
              style={{
                width: '100%',
                marginTop: '20px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {isSubmitting ? (
                <>Đang gửi yêu cầu...</>
              ) : (activeJob?.status === 'QUEUED' || activeJob?.status === 'PROCESSING') ? (
                <>Đang Tạo Giọng Nói...</>
              ) : (
                <>
                  Tạo Giọng Nói
                </>
              )}
            </button>
          </div>

          {/* Tiến Trình Xử Lý */}
          {activeJob && (
            <div style={{ marginTop: '20px' }}>
              <JobProgress
                progress={activeJob.progress}
                status={activeJob.status}
                onCancel={async () => {
                  await api.cancelJob(activeJob.id);
                  setActiveJob(null);
                }}
              />
            </div>
          )}

          {/* Trình Phát Âm Thanh Kết Quả */}
          {activeJob?.status === 'COMPLETED' && activeJob.audio_url && (
            <AudioPlayer
              streamUrl={activeJob.audio_url}
              wavUrl={activeJob.wav_url}
              mp3Url={activeJob.mp3_url}
              voiceName={voices.find(v => v.id === selectedVoiceId)?.name}
              emotion={emotion}
              duration={activeJob.duration}
            />
          )}
        </div>

        {/* Cột Phải: Điều Khiển Âm Học & Giọng Đọc */}
        <div>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={18} color="var(--accent-secondary)" /> Tùy Chỉnh Giọng Đọc
            </h3>

            {/* Chọn Giọng */}
            {!isMultiSpeaker && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
                    Giọng Đọc
                  </label>
                  <button
                    onClick={onOpenVoiceModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--accent-secondary)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <PlusCircle size={13} /> + Thêm giọng
                  </button>
                </div>
                {voices.length === 0 ? (
                  <div style={{
                    padding: '14px',
                    borderRadius: '10px',
                    border: '1px dashed var(--border-color)',
                    textAlign: 'center',
                    fontSize: '13px',
                    color: 'var(--text-dim)'
                  }}>
                    Chưa có giọng nào trong hệ thống.
                    <br />
                    <button
                      onClick={onOpenVoiceModal}
                      className="btn-secondary"
                      style={{ marginTop: '8px', fontSize: '12px' }}
                    >
                      <Mic size={14} /> Tải Lên Giọng Của Tôi
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedVoiceId}
                    onChange={(e) => setSelectedVoiceId(e.target.value)}
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.language.toUpperCase()})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Chọn Cảm Xúc */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Sắc Thái Cảm Xúc
              </label>
              <select value={emotion} onChange={(e) => setEmotion(e.target.value)}>
                {EMOTIONS.map((emo) => (
                  <option key={emo.id} value={emo.id}>
                    {emo.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Cường độ cảm xúc */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cường Độ Biểu Cảm</label>
                <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--accent-secondary)' }}>
                  {emotionIntensity.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="2.0"
                step="0.1"
                value={emotionIntensity}
                onChange={(e) => setEmotionIntensity(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>Nhẹ nhàng</span>
                <span>Tiêu chuẩn</span>
                <span>Mạnh mẽ</span>
              </div>
            </div>

            {/* Tốc độ đọc */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tốc Độ Đọc</label>
                <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--accent-secondary)' }}>
                  {speed.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>0.5x Chậm</span>
                <span>1.0x Bình thường</span>
                <span>2.0x Nhanh</span>
              </div>
            </div>

            {/* Độ cao giọng (Pitch Shift) */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Độ Cao Giọng (Pitch)</label>
                <span style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--accent-secondary)' }}>
                  {pitch > 0 ? ('+' + pitch) : pitch} st
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                <span>-12 Trầm</span>
                <span>0 Chuẩn</span>
                <span>+12 Bổng</span>
              </div>
            </div>

            {/* Định dạng đầu ra */}
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}>
                Định Dạng Âm Thanh Xuất Ra
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {['mp3', 'wav'].map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setOutputFormat(fmt as any)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: outputFormat === fmt ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: outputFormat === fmt ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: outputFormat === fmt ? '#fff' : 'var(--text-muted)',
                      fontWeight: outputFormat === fmt ? '600' : '400',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textTransform: 'uppercase'
                    }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
