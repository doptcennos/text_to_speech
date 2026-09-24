import { Voice, TTSJob, SystemInfo, HealthStatus, SpeakerMappingItem } from '../types';

const API_BASE = '/api';

export const api = {
  // Voices
  async getVoices(): Promise<Voice[]> {
    const res = await fetch(`${API_BASE}/voices`);
    if (!res.ok) throw new Error('Failed to fetch voices');
    return res.json();
  },

  async createVoice(formData: FormData): Promise<Voice> {
    const res = await fetch(`${API_BASE}/voices`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create voice');
    }
    return res.json();
  },

  async deleteVoice(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/voices/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete voice');
  },

  async rebuildEmbedding(id: string): Promise<Voice> {
    const res = await fetch(`${API_BASE}/voices/${id}/rebuild-embedding`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to rebuild embedding');
    return res.json();
  },

  // TTS
  async generateSpeech(payload: {
    text: string;
    voice_id?: string;
    emotion: string;
    emotion_intensity: number;
    speed: number;
    pitch: number;
    output_format: string;
    multi_speaker?: boolean;
    speakers?: SpeakerMappingItem[];
  }): Promise<{ job_id: string; status: string; progress: number; message: string }> {
    const res = await fetch(`${API_BASE}/tts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to submit TTS job');
    }
    return res.json();
  },

  async getJobs(): Promise<TTSJob[]> {
    const res = await fetch(`${API_BASE}/tts/jobs`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async getJob(id: string): Promise<TTSJob> {
    const res = await fetch(`${API_BASE}/tts/jobs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch job');
    return res.json();
  },

  async cancelJob(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tts/jobs/${id}/cancel`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to cancel job');
  },

  async deleteJob(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/tts/jobs/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete history record');
  },


  async deleteAudio(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/audio/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete audio');
  },

  // System & Health
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health');
    return res.json();
  },

  async getSystemInfo(): Promise<SystemInfo> {
    const res = await fetch(`${API_BASE}/system/info`);
    if (!res.ok) throw new Error('Failed to fetch system info');
    return res.json();
  },

  async downloadModel(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/system/download-model`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger model download');
    return res.json();
  },
};
