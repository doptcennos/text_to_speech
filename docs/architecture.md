# Kiến trúc Hệ thống Text-to-Speech & Voice Cloning

Tài liệu này mô tả chi tiết kiến trúc kỹ thuật của hệ thống Text-to-Speech chạy cục bộ bằng Docker trên Ubuntu 22.04.

---

## 1. Sơ đồ Tổng thể Kiến trúc

```text
+-----------------------------------------------------------------+
|                  Trình duyệt người dùng (Client)                |
|           React + TypeScript + Vite + Modern CSS (Dark Mode)     |
+-----------------------------------------------------------------+
                                |  HTTP REST API / Web Stream
                                v
+-----------------------------------------------------------------+
|                        FastAPI Backend                          |
|  - API Router (/api/voices, /api/tts, /api/audio, /api/system)  |
|  - Middleware CORS, Request Validation, Error Handler           |
+-------------------------------+---------------------------------+
                                |
        +-----------------------+-----------------------+
        v                                               v
+------------------------+                     +-----------------+
| SQLite Database (ORM)  |                     | Storage Manager |
| - voices               |                     | - storage/voices|
| - tts_jobs             |                     | - storage/gen/  |
| - audio_files          |                     | - storage/models|
| - settings             |                     | - storage/temp/ |
+------------------------+                     +-----------------+
        ^                                               ^
        |                                               |
+-------+-----------------------------------------------+---------+
|               Background Job Queue & TTS Worker                 |
|  - Priority Queue / In-Memory Async Worker                      |
|  - Trạng thái Job: QUEUED -> PROCESSING -> COMPLETED / FAILED   |
+-------------------------------+---------------------------------+
                                |
                                v
+-----------------------------------------------------------------+
|                  TTS Engine & Voice Cloning                     |
|  - BaseTTSEngine Interface                                      |
|  - Neural Speaker Encoder (Extracts embedding.bin from sample)  |
|  - Synthesis Acoustic Model (Loaded ONCE in memory)             |
|  - Emotion & Prosody Modulation Service                         |
|  - Text Expression & Multi-Speaker Parser                       |
|  - FFmpeg Audio Pipeline (Normalize, Resample, MP3/WAV)         |
+-----------------------------------------------------------------+
```

---

## 2. Các Luồng Nghiệp vụ Chính (Core Workflows)

### 2.1. Luồng Tạo Giọng (Create Voice & Voice Profile)
1. **Voice Consent Checkbox**: Người dùng xác nhận sở hữu giọng nói qua hộp thoại Voice Consent (`I confirm that I own this voice or have permission to use this voice.`).
2. **Upload Audio**: Tải lên mẫu giọng (.wav, .mp3, .m4a, .flac).
3. **Audio Preprocessing**:
   - Kiểm tra định dạng và tính toàn vẹn qua FFmpeg.
   - Chuẩn hóa âm lượng EBU R128 (-20 LUFS).
   - Resampling sang tần số chuẩn (22050Hz / 44100Hz mono).
   - Cắt bỏ khoảng lặng thừa ở đầu và cuối (Silence trimming).
   - Lưu trữ tại: `storage/voices/<voice_id>/sample.wav` và `storage/voices/<voice_id>/normalized.wav`.
4. **Speaker Embedding Extraction**:
   - Neural Speaker Encoder phân tích đặc trưng phổ (Mel-spectrogram, F0, Formants).
   - Tạo vector đặc trưng người nói (`storage/voices/<voice_id>/embedding.bin`).
5. **Database Persistence**: Lưu bản ghi Voice trên SQLite kèm đường dẫn thư mục.

### 2.2. Luồng Sinh Giọng Nói (TTS Generation Flow)
1. **Submit Job**: Người dùng gửi yêu cầu sinh giọng nói (text, voice_id, emotion, speed, pitch, output_format).
2. **Expression & Dialogue Parsing**:
   - Nếu kịch bản có định dạng thoại nhiều người (`Speaker: Text`), hệ thống phân tách thành từng phân đoạn và gán voice tương ứng.
   - Nhận diện các thẻ điều khiển (`[pause 500ms]`, `[laugh]`, `[whisper]`, `[excited]`, `[slow]`, `[fast]`).
3. **Queueing**: Tạo bản ghi trong `tts_jobs` với trạng thái `QUEUED`, trả về `job_id` cho Frontend.
4. **Worker Processing**:
   - Nạp speaker embedding từ file cache `embedding.bin`.
   - Áp dụng các trọng số cảm xúc (Emotion Parameters: speed, pitch, energy, prosody, style prompt).
   - Sinh chuỗi âm thanh cho từng phân đoạn văn bản dựa trên voice embedding.
   - Ghép nối các đoạn âm thanh và chèn khoảng lặng tự nhiên qua FFmpeg.
5. **Export & Normalization**:
   - Xuất file gốc định dạng WAV PCM 16-bit 44.1kHz.
   - Nén sang file MP3 theo bitrate yêu cầu (128k, 192k, 256k, 320k).
   - Cập nhật bản ghi `audio_files` và chuyển `tts_jobs` sang `COMPLETED`.

---

## 3. Quản lý Bộ nhớ & Tối ưu Hóa (Performance & Memory)
- **Singleton Model Manager**: Model TTS và Speaker Encoder được nạp một lần duy nhất vào bộ nhớ khi khởi động worker, không nạp lại trên mỗi HTTP request.
- **Embedding Cache**: Embedding của mỗi giọng nói được lưu dưới dạng file nhị phân và lưu trên bộ nhớ đệm, loại bỏ hoàn toàn chi phí tính toán lại embedding khi sinh âm thanh.
- **Dọn dẹp File Tạm**: Không lưu audio lớn trong RAM, tạo chuỗi streaming và sử dụng các file tạm tại `storage/temp/` sẽ được dọn dẹp tự động sau khi hoàn thành.
