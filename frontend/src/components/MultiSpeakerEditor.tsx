import React from 'react';
import { Voice, SpeakerMappingItem } from '../types';
import { Users, Plus, Trash2, MessageSquarePlus, Sparkles } from 'lucide-react';

interface MultiSpeakerEditorProps {
  speakers: SpeakerMappingItem[];
  setSpeakers: React.Dispatch<React.SetStateAction<SpeakerMappingItem[]>>;
  availableVoices: Voice[];
  onInsertSpeakerTurn?: (speakerName: string) => void;
  onApplySampleScript?: () => void;
}

const EMOTIONS = [
  { id: 'Neutral', label: 'Tự nhiên' },
  { id: 'Friendly', label: 'Thân thiện' },
  { id: 'Happy', label: 'Vui vẻ' },
  { id: 'Excited', label: 'Hào hứng' },
  { id: 'Warm', label: 'Ấm áp' },
  { id: 'Serious', label: 'Nghiêm túc' },
  { id: 'Sad', label: 'U sầu' },
  { id: 'Whisper', label: 'Thì thầm' },
  { id: 'Funny', label: 'Hài hước' }
];

export const MultiSpeakerEditor: React.FC<MultiSpeakerEditorProps> = ({
  speakers,
  setSpeakers,
  availableVoices,
  onInsertSpeakerTurn,
  onApplySampleScript
}) => {
  const addSpeaker = () => {
    if (availableVoices.length === 0) return;
    const defaultVoice = availableVoices[speakers.length % availableVoices.length];
    setSpeakers((prev) => [
      ...prev,
      {
        speaker_name: defaultVoice ? defaultVoice.name : ('Nhân vật ' + (prev.length + 1)),
        voice_id: defaultVoice ? defaultVoice.id : availableVoices[0].id,
        emotion: 'Friendly',
        speed: 1.0,
        pitch: 0.0,
      },
    ]);
  };

  const removeSpeaker = (idx: number) => {
    setSpeakers((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateSpeaker = (idx: number, field: keyof SpeakerMappingItem, value: any) => {
    setSpeakers((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  return (
    <div style={{
      marginTop: '16px',
      padding: '18px',
      background: 'rgba(15, 23, 42, 0.5)',
      borderRadius: '12px',
      border: '1px solid rgba(99, 102, 241, 0.25)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="#818cf8" />
          <div>
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Phân công Giọng Đọc & Nhân Vật</span>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: 0 }}>
              Gán từng tên nhân vật trong kịch bản với giọng đọc và cảm xúc riêng biệt
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {onApplySampleScript && (
            <button
              type="button"
              onClick={onApplySampleScript}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Sparkles size={12} color="#fbbf24" /> Nạp Kịch Bản Mẫu
            </button>
          )}
          <button type="button" onClick={addSpeaker} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
            <Plus size={14} /> + Thêm Nhân Vật
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {speakers.map((spk, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
              background: 'rgba(255, 255, 255, 0.03)',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ flex: '1 1 180px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>Tên Trong Kịch Bản:</label>
              <input
                type="text"
                placeholder="Ví dụ: Thùy Tiên - Linh"
                value={spk.speaker_name}
                onChange={(e) => updateSpeaker(idx, 'speaker_name', e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px' }}
              />
            </div>

            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>Giọng Đọc AI:</label>
              <select
                value={spk.voice_id}
                onChange={(e) => updateSpeaker(idx, 'voice_id', e.target.value)}
                style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px' }}
              >
                {availableVoices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ flex: '0 1 130px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-dim)', display: 'block', marginBottom: '3px' }}>Cảm Xúc Nhân Vật:</label>
              <select
                value={spk.emotion || 'Neutral'}
                onChange={(e) => updateSpeaker(idx, 'emotion', e.target.value)}
                style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px' }}
              >
                {EMOTIONS.map((emo) => (
                  <option key={emo.id} value={emo.id}>
                    {emo.label}
                  </option>
                ))}
              </select>
            </div>

            {onInsertSpeakerTurn && (
              <button
                type="button"
                onClick={() => onInsertSpeakerTurn(spk.speaker_name)}
                title="Chèn mẫu lời thoại của nhân vật này vào kịch bản"
                style={{
                  background: 'rgba(99, 102, 241, 0.15)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  borderRadius: '6px',
                  color: '#818cf8',
                  padding: '7px 10px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '15px'
                }}
              >
                <MessageSquarePlus size={13} /> + Thoại
              </button>
            )}

            <button
              type="button"
              onClick={() => removeSpeaker(idx)}
              title="Xóa nhân vật này"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: 'var(--error)',
                padding: '7px 9px',
                cursor: 'pointer',
                marginTop: '15px'
              }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
