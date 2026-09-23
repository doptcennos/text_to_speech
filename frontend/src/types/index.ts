export interface Voice {
  id: string;
  name: string;
  description?: string;
  language: string;
  engine: string;
  model: string;
  sample_path?: string;
  embedding_path?: string;
  has_sample: boolean;
  has_embedding: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpeakerMappingItem {
  speaker_name: string;
  voice_id: string;
  emotion?: string;
  speed?: number;
  pitch?: number;
}

export interface TTSJob {
  id: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  text: string;
  voice_id?: string;
  voice_name?: string;
  emotion: string;
  speed: number;
  output_format: 'wav' | 'mp3';
  audio_id?: string;
  audio_url?: string;
  wav_url?: string;
  mp3_url?: string;
  duration?: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface SystemInfo {
  cpu: string;
  cpu_cores: number;
  ram_total_gb: number;
  ram_available_gb: number;
  gpu?: string;
  vram_total_mb?: number;
  vram_used_mb?: number;
  cuda_available: boolean;
  cuda_version?: string;
  pytorch_version: string;
  tts_engine: string;
  model_status: string;
  disk_free_gb: number;
}

export interface HealthStatus {
  status: string;
  tts_engine: string;
  model: string;
  storage: string;
}
