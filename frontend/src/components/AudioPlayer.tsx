import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, Volume2, Music } from 'lucide-react';

interface AudioPlayerProps {
  streamUrl: string;
  wavUrl?: string;
  mp3Url?: string;
  voiceName?: string;
  emotion?: string;
  duration?: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  streamUrl,
  wavUrl,
  mp3Url,
  voiceName,
  emotion,
  duration = 0,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [streamUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', marginTop: '24px' }}>
      <audio
        ref={audioRef}
        src={streamUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Music size={18} color="var(--accent-primary)" />
          </div>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Âm Thanh Đã Được Tổng Hợp</h4>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {voiceName && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted)'
                }}>
                  Giọng đọc: <b>{voiceName}</b>
                </span>
              )}
              {emotion && (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  color: 'var(--accent-secondary)'
                }}>
                  {emotion}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Nút Tải Về */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {wavUrl && (
            <a href={wavUrl} download className="btn-secondary" style={{ textDecoration: 'none', fontSize: '13px' }}>
              <Download size={14} /> Tải WAV
            </a>
          )}
          {mp3Url && (
            <a href={mp3Url} download className="btn-secondary" style={{ textDecoration: 'none', fontSize: '13px' }}>
              <Download size={14} /> Tải MP3
            </a>
          )}
        </div>
      </div>

      {/* Điều Khiển Phát Nhạc */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={togglePlay}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'var(--accent-gradient)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 'var(--accent-glow)',
            flexShrink: 0
          }}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: '2px' }} />}
        </button>

        <span style={{ fontSize: '13px', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', minWidth: '40px' }}>
          {formatTime(currentTime)}
        </span>

        <input
          type="range"
          min={0}
          max={totalDuration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          style={{ flex: 1 }}
        />

        <span style={{ fontSize: '13px', fontFamily: 'JetBrains Mono', color: 'var(--text-muted)', minWidth: '40px' }}>
          {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
};
