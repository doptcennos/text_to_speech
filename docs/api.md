# Tài liệu API - Hệ thống Text-to-Speech & Voice Cloning

FastAPI cung cấp tài liệu tương tác tự động tại:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Tất cả các API được đặt tiền tố `/api`.

---

## 1. Voice Management API (`/api/voices`)

### 1.1. Lấy danh sách Voice Profiles
- **Endpoint**: `GET /api/voices`
- **Response**: `200 OK`
```json
[
  {
    "id": "c1f7b8e2-4b2a-4a21-9988-123456789abc",
    "name": "Giọng của tôi",
    "description": "Giọng đọc chính chủ",
    "language": "vi",
    "engine": "neural_clone",
    "model": "vivos-vits-clone",
    "sample_path": "/app/storage/voices/c1f7b8e2-.../sample.wav",
    "embedding_path": "/app/storage/voices/c1f7b8e2-.../embedding.bin",
    "has_embedding": true,
    "created_at": "2026-09-23T10:00:00Z",
    "updated_at": "2026-09-23T10:00:00Z"
  }
]
```

### 1.2. Tạo Voice Profile mới (kèm file mẫu)
- **Endpoint**: `POST /api/voices`
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `name` (string, required): Tên giọng nói (ví dụ: `Nguyen Van A`)
  - `description` (string, optional): Mô tả
  - `language` (string, default: `vi`): Ngôn ngữ
  - `consent` (boolean, required: `true`): Xác nhận sở hữu giọng nói
  - `sample` (file, required): File audio mẫu (`.wav`, `.mp3`, `.m4a`, `.flac`)
- **Response**: `201 Created`

### 1.3. Lấy chi tiết Voice
- **Endpoint**: `GET /api/voices/{id}`
- **Response**: `200 OK`

### 1.4. Cập nhật Voice
- **Endpoint**: `PUT /api/voices/{id}`
- **Body**:
```json
{
  "name": "Giọng mới",
  "description": "Cập nhật mô tả"
}
```

### 1.5. Xóa Voice
- **Endpoint**: `DELETE /api/voices/{id}`
- **Response**: `204 No Content` (Xóa DB và toàn bộ file trong `storage/voices/<id>/`)

### 1.6. Tải lên lại mẫu âm thanh
- **Endpoint**: `POST /api/voices/{id}/sample`
- **Content-Type**: `multipart/form-data`
- **Parameters**: `sample` (file)

### 1.7. Tạo lại embedding
- **Endpoint**: `POST /api/voices/{id}/rebuild-embedding`
- **Response**: `200 OK`

---

## 2. Text-to-Speech API (`/api/tts`)

### 2.1. Yêu cầu sinh âm thanh (Submit Job)
- **Endpoint**: `POST /api/tts/generate`
- **Content-Type**: `application/json`
- **Body**:
```json
{
  "text": "Xin chào mọi người! [pause 500ms] Đây là giọng nói của tôi.",
  "voice_id": "c1f7b8e2-4b2a-4a21-9988-123456789abc",
  "emotion": "Friendly",
  "emotion_intensity": 1.0,
  "speed": 1.0,
  "pitch": 0.0,
  "output_format": "mp3",
  "multi_speaker_script": false,
  "speakers": []
}
```
- **Response**: `202 Accepted`
```json
{
  "job_id": "89ab12cd-ef34-5678-90ab-cdef12345678",
  "status": "QUEUED",
  "progress": 0,
  "message": "Job queued successfully"
}
```

### 2.2. Lấy danh sách Job
- **Endpoint**: `GET /api/tts/jobs`
- **Response**: `200 OK`

### 2.3. Lấy trạng thái Job chi tiết
- **Endpoint**: `GET /api/tts/jobs/{id}`
- **Response**: `200 OK`
```json
{
  "id": "89ab12cd-ef34-5678-90ab-cdef12345678",
  "status": "COMPLETED",
  "progress": 100,
  "text": "Xin chào mọi người!",
  "voice_id": "c1f7b8e2-4b2a-4a21-9988-123456789abc",
  "voice_name": "Giọng của tôi",
  "emotion": "Friendly",
  "speed": 1.0,
  "output_format": "mp3",
  "audio_id": "77112233-4455-6677-8899-aabbccddeeff",
  "audio_url": "/api/audio/77112233-4455-6677-8899-aabbccddeeff/stream",
  "wav_download_url": "/api/audio/77112233-4455-6677-8899-aabbccddeeff/download?format=wav",
  "mp3_download_url": "/api/audio/77112233-4455-6677-8899-aabbccddeeff/download?format=mp3",
  "duration": 4.25,
  "created_at": "2026-09-23T10:05:00Z",
  "completed_at": "2026-09-23T10:05:03Z",
  "error_message": null
}
```

### 2.4. Hủy Job
- **Endpoint**: `POST /api/tts/jobs/{id}/cancel`

---

## 3. Audio Stream & Download API (`/api/audio`)

### 3.1. Danh sách Audio đã sinh
- **Endpoint**: `GET /api/audio`

### 3.2. Lấy thông tin Audio
- **Endpoint**: `GET /api/audio/{id}`

### 3.3. Stream Audio cho trình phát nhạc (Audio Player)
- **Endpoint**: `GET /api/audio/{id}/stream`
- **Supports HTTP Range Requests**: Hỗ trợ tua âm thanh mượt mà trên browser.

### 3.4. Tải file âm thanh (Download)
- **Endpoint**: `GET /api/audio/{id}/download?format=mp3` hoặc `?format=wav`
- **Response**: File attachment với filename rõ ràng.

### 3.5. Xóa file âm thanh
- **Endpoint**: `DELETE /api/audio/{id}`

---

## 4. System & Health API (`/api/system`, `/api/health`)

### 4.1. Health Check
- **Endpoint**: `GET /api/health`
- **Response**: `200 OK`
```json
{
  "status": "ok",
  "tts_engine": "ready",
  "model": "ready",
  "storage": "ok"
}
```

### 4.2. Thông tin phần cứng & hệ thống
- **Endpoint**: `GET /api/system/info`
- **Response**:
```json
{
  "cpu": "AMD Ryzen / Intel Core",
  "ram_total_gb": 7.7,
  "ram_available_gb": 5.2,
  "gpu": "NVIDIA GeForce ...",
  "vram_total_mb": 1024,
  "vram_used_mb": 888,
  "cuda_available": true,
  "cuda_version": "11.4",
  "pytorch_version": "2.x",
  "tts_engine": "Neural Voice Cloning Engine",
  "model_status": "ready",
  "disk_free_gb": 942.0
}
```

### 4.3. Trigger tải model
- **Endpoint**: `POST /api/system/download-model`
- **Response**: Bắt đầu tải model vào `/storage/models/`.
