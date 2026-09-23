# PROMPT CHO ANTIGRAVITY IDE

## PROJECT: TEXT-TO-SPEECH

Bạn là **Senior AI Engineer + Python Developer + Full-Stack Developer + Docker Engineer**, chuyên xây dựng hệ thống TTS, Voice Cloning, Audio Processing và AI chạy local.

Hãy **trực tiếp tạo source code hoàn chỉnh** cho một project tên:

```text
text-to-speech
```

Mục tiêu:

> Tôi tự thu âm giọng nói của mình → upload file giọng → nhập tên cho giọng → hệ thống lưu giọng đó → sau này tôi chọn tên giọng → nhập văn bản → chọn cảm xúc → hệ thống tạo audio bằng chính giọng đã đăng ký.

Hệ thống phải chạy **local bằng Docker trên Ubuntu 22.04**.

Không sử dụng API trả phí để tạo giọng.

---

# 1. MỤC TIÊU CHÍNH

Ứng dụng phải có flow:

```text
Tôi thu âm giọng
       ↓
Upload file audio
       ↓
Nhập tên giọng
       ↓
Create Voice
       ↓
Voice Profile
       ↓
Chọn Voice
       ↓
Nhập Text
       ↓
Chọn Emotion
       ↓
Generate
       ↓
Nghe thử
       ↓
Download MP3 / WAV
```

Ví dụ:

```text
Voice Name:
[ Giong cua Toi ]

Audio:
[ my_voice.wav ]

[ CREATE VOICE ]
```

Sau khi tạo:

```text
My Voices

┌──────────────────────────────┐
│ Giong cua Toi                │
│ Vietnamese                   │
│ Voice Clone                  │
│                              │
│ [▶ Test] [Edit] [Delete]    │
└──────────────────────────────┘
```

Sau đó vào Studio:

```text
Voice:
[ Giong cua Toi ▼ ]

Emotion:
[ Happy ▼ ]

Text:

Xin chào mọi người! Chào mừng
đến với hệ thống Text-to-Speech.

[ Generate Speech ]
```

Kết quả:

```text
▶ Play

[ Download WAV ]
[ Download MP3 ]
```

---

# 2. QUAN TRỌNG: KHÔNG DÙNG GIỌNG ĐƯỢC TẠO SẴN

Không hard-code:

```text
Linh
Hà
Mai
Lan
```

Không cần tạo sẵn các nhân vật.

Ban đầu hệ thống chỉ có:

```text
My Voices
```

Người dùng **tự upload giọng của mình**.

Ví dụ:

```text
Voice Name:
Nguyen Van A

Voice Sample:
nguyen_van_a.wav
```

Hệ thống phải tạo:

```text
Voice Profile
    ↓
Voice ID
    ↓
Voice Embedding / Speaker Representation
    ↓
TTS Engine
```

Sau đó người dùng có thể tạo nhiều giọng:

```text
My Voice
My Voice Funny
My Voice Serious
My Voice Male
Test Voice
```

---

# 3. TTS ENGINE

Trước khi code, hãy nghiên cứu các TTS engine open-source hiện tại.

Ưu tiên engine có:

1. Vietnamese
2. Voice Cloning
3. Speaker Embedding
4. Emotion / Style
5. Multilingual
6. Local inference
7. Offline inference
8. GPU NVIDIA
9. CPU fallback
10. Docker support
11. License phù hợp

Có thể đánh giá:

```text
XTTS
GPT-SoVITS
Fish Speech
F5-TTS
CosyVoice
các model TTS open-source khác
```

Không được chọn engine chỉ vì phổ biến.

Hãy kiểm tra khả năng:

```text
Vietnamese
Voice cloning
Emotion
CPU
GPU
VRAM
Docker
Offline
License
```

Tạo tài liệu:

```text
docs/tts-engine-comparison.md
```

Sau đó chọn engine phù hợp nhất.

---

# 4. KIẾN TRÚC

Thiết kế:

```text
Browser
   │
   ▼
Frontend
   │
   ▼
FastAPI
   │
   ├── Voice Manager
   │
   ├── TTS Manager
   │
   ├── Audio Processor
   │
   ├── Job Manager
   │
   └── Storage Manager
          │
          ▼
       TTS Model
          │
          ▼
     WAV / MP3
```

---

# 5. BACKEND

Sử dụng:

```text
Python 3.11+
FastAPI
Pydantic
SQLAlchemy
SQLite
Uvicorn
FFmpeg
```

Thiết kế service:

```text
backend/app/

├── main.py
├── config.py
├── database.py
│
├── api/
│   ├── voices.py
│   ├── tts.py
│   ├── audio.py
│   └── system.py
│
├── models/
│   ├── voice.py
│   ├── tts_job.py
│   └── audio_file.py
│
├── schemas/
│
├── services/
│   ├── voice_service.py
│   ├── tts_service.py
│   ├── audio_service.py
│   ├── emotion_service.py
│   └── model_service.py
│
├── engines/
│   ├── base.py
│   └── selected_engine.py
│
└── workers/
    └── tts_worker.py
```

---

# 6. FRONTEND

Sử dụng:

```text
React
TypeScript
Vite
```

UI hiện đại, đơn giản, dễ sử dụng.

Cấu trúc:

```text
frontend/

├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── App.tsx
│
├── package.json
└── Dockerfile
```

---

# 7. TRANG STUDIO

Trang chính:

```text
TEXT-TO-SPEECH
```

Layout:

```text
┌─────────────────────────────────────────────────┐
│ TEXT-TO-SPEECH                                  │
├───────────────┬─────────────────────────────────┤
│               │                                 │
│ Studio        │ Text                            │
│ Voices        │                                 │
│ History       │ ┌─────────────────────────────┐ │
│ Settings      │ │ Nhập nội dung cần đọc...   │ │
│               │ │                             │ │
│               │ └─────────────────────────────┘ │
│               │                                 │
│               │ Voice                           │
│               │ [ Giong cua Toi ▼ ]             │
│               │                                 │
│               │ Emotion                         │
│               │ [ Happy ▼ ]                     │
│               │                                 │
│               │ Speed                           │
│               │ ─────────●────────              │
│               │                                 │
│               │ [ Generate Speech ]             │
│               │                                 │
└───────────────┴─────────────────────────────────┘
```

---

# 8. VOICE MANAGEMENT

Trang:

```text
Voices
```

Có nút:

```text
+ Add Voice
```

Form:

```text
Voice Name
[________________________]

Description
[________________________]

Language
[ Vietnamese ▼ ]

Voice Sample
[ Choose Audio ]

[ Create Voice ]
```

---

# 9. AUDIO UPLOAD

Cho phép:

```text
.wav
.mp3
.flac
.m4a
```

Backend phải:

```text
Upload
 ↓
Validate
 ↓
Convert
 ↓
Normalize
 ↓
Resample
 ↓
Trim Silence nếu cần
 ↓
Save
```

Không giữ file lớn trong RAM.

---

# 10. VOICE PROFILE

Database:

```text
voices
```

Fields:

```text
id
name
description
language
engine
model
sample_path
embedding_path
created_at
updated_at
```

Không lưu audio/embedding trực tiếp vào database nếu file lớn.

Lưu:

```text
storage/voices/
```

Ví dụ:

```text
storage/
└── voices/
    ├── voice_001/
    │   ├── sample.wav
    │   ├── normalized.wav
    │   └── embedding.bin
    │
    └── voice_002/
```

---

# 11. VOICE CLONING

Khi tạo Voice:

```text
Upload Sample
       ↓
Audio preprocessing
       ↓
Speaker Encoder
       ↓
Speaker Embedding
       ↓
Voice Profile
```

Khi generate:

```text
Text
 +
Voice Embedding
 +
Emotion
       ↓
TTS Model
       ↓
Audio
```

Embedding phải được cache.

Không tính lại embedding mỗi lần generate nếu sample không thay đổi.

---

# 12. NHIỀU VOICE

Người dùng có thể tạo không giới hạn số Voice Profile, giới hạn bởi disk.

Ví dụ:

```text
Voice 1
Nguyen Van A

Voice 2
Nguyen Van A Funny

Voice 3
Nguyen Van A Serious
```

UI:

```text
[▶] Nguyen Van A
[▶] Nguyen Van A Funny
[▶] Nguyen Van A Serious
```

---

# 13. EMOTION

Hỗ trợ:

```text
Neutral
Happy
Excited
Sad
Angry
Calm
Friendly
Serious
Confident
Shy
Funny
Warm
Sarcastic
Whisper
```

Có:

```text
Emotion Intensity
```

Slider:

```text
Low ─────────●──────── High
```

Nếu engine hỗ trợ emotion native thì sử dụng native emotion.

Nếu engine không hỗ trợ emotion native thì tạo abstraction để điều chỉnh:

```text
speed
pitch
energy
pause
style prompt
temperature
volume
```

Không giả vờ rằng model có emotion native nếu thực tế không có.

---

# 14. TEXT EXPRESSION

Cho phép nhập:

```text
[pause 500ms]

[laugh]

[whisper]

[excited]

[slow]

[fast]
```

Ví dụ:

```text
Mọi người ơi!

[pause 500ms]

Hôm nay chúng ta sẽ tổ chức Trung Thu!
```

Parser phải chuyển expression thành cấu hình TTS tương ứng.

---

# 15. MULTI-SPEAKER

Hỗ trợ format:

```text
Nguyen Van A:
Xin chào mọi người.

Voice 2:
Xin chào!

Nguyen Van A:
Hôm nay chúng ta có một thông báo.
```

UI cho phép map:

```text
Speaker          Voice
--------------------------------
Nguyen Van A     [ My Voice ▼ ]
Voice 2          [ Test Voice ▼ ]
```

Mỗi speaker có:

```text
Voice
Emotion
Speed
Pitch
```

---

# 16. AUDIO GENERATION

Flow:

```text
Text
 ↓
Text preprocessing
 ↓
Speaker detection
 ↓
Voice selection
 ↓
Emotion
 ↓
TTS
 ↓
WAV
 ↓
Audio normalization
 ↓
MP3 conversion
```

---

# 17. MP3 / WAV

Bắt buộc hỗ trợ:

```text
WAV
MP3
```

WAV:

```text
PCM
16-bit
44100 Hz
```

MP3:

```text
128 kbps
192 kbps
256 kbps
320 kbps
```

UI:

```text
Output Format

○ WAV
○ MP3
```

---

# 18. AUDIO PLAYER

Sau khi generate:

```text
Generated Audio

▶ ━━━━━━━━━━━━━━━━━━━ 00:23

Voice:
My Voice

Emotion:
Happy

[ Download WAV ]

[ Download MP3 ]
```

---

# 19. HISTORY

Trang:

```text
History
```

Hiển thị:

```text
Date
Text
Voice
Emotion
Duration
Format
Status
```

Ví dụ:

```text
23/09/2026
Xin chào mọi người!
My Voice
Happy
00:12
MP3
Completed
```

Có:

```text
Play
Download
Delete
Regenerate
```

---

# 20. JOB QUEUE

Không chạy TTS nặng trực tiếp trong HTTP request.

Tạo:

```text
TTS Job
```

Status:

```text
QUEUED
PROCESSING
COMPLETED
FAILED
CANCELLED
```

UI:

```text
Generating...

██████████████░░░░░░

65%
```

Worker phải xử lý background.

Không tạo ZIP hoặc giữ audio lớn trong RAM.

---

# 21. STORAGE

```text
storage/
│
├── voices/
├── generated/
├── temp/
└── models/
```

Database chỉ lưu metadata/path.

---

# 22. DATABASE

Tối thiểu:

```text
voices
tts_jobs
audio_files
settings
```

### voices

```text
id
name
description
language
engine
model
sample_path
embedding_path
created_at
updated_at
```

### tts_jobs

```text
id
status
text
voice_id
emotion
emotion_intensity
speed
pitch
output_format
created_at
completed_at
error_message
```

### audio_files

```text
id
job_id
file_path
format
duration
size
created_at
```

---

# 23. API

Implement:

```text
GET    /api/voices

POST   /api/voices

GET    /api/voices/{id}

PUT    /api/voices/{id}

DELETE /api/voices/{id}

POST   /api/voices/{id}/sample

POST   /api/voices/{id}/rebuild-embedding

POST   /api/tts/generate

GET    /api/tts/jobs

GET    /api/tts/jobs/{id}

POST   /api/tts/jobs/{id}/cancel

GET    /api/audio

GET    /api/audio/{id}

DELETE /api/audio/{id}

GET    /api/health

GET    /api/system/info
```

Swagger:

```text
/docs
```

---

# 24. DOCKER

Tạo:

```text
Dockerfile
docker-compose.yml
docker-compose.gpu.yml
.dockerignore
.env.example
```

CPU:

```bash
docker compose up -d
```

GPU:

```bash
docker compose -f docker-compose.gpu.yml up -d
```

---

# 25. GPU NVIDIA

Nếu có NVIDIA:

```text
Ubuntu 22.04
       ↓
NVIDIA Driver
       ↓
NVIDIA Container Toolkit
       ↓
Docker
       ↓
PyTorch CUDA
       ↓
TTS
```

Hỗ trợ GPU.

Nếu không có GPU:

```text
CPU mode
```

Nếu model không chạy tốt trên CPU thì phải thông báo rõ yêu cầu phần cứng.

---

# 26. VOLUME

Không được mất:

```text
Voice
Embedding
Generated Audio
Model
Database
```

khi container restart.

Docker Compose phải mount:

```yaml
volumes:
  - ./data:/app/data
  - ./models:/app/models
  - ./storage:/app/storage
```

---

# 27. OFFLINE

Sau khi model đã download:

```text
Internet OFF
     ↓
Docker
     ↓
TTS
     ↓
Voice Clone
     ↓
Generate
```

vẫn phải chạy được.

Không gọi cloud API trong quá trình TTS.

---

# 28. CONFIG

`.env.example`:

```env
APP_NAME=text-to-speech
APP_ENV=production

DATABASE_URL=sqlite:///./data/tts.db

MODEL_PATH=/app/models

STORAGE_PATH=/app/storage

DEFAULT_LANGUAGE=vi

MAX_UPLOAD_SIZE_MB=100

MAX_CONCURRENT_TTS=1

DEFAULT_OUTPUT_FORMAT=mp3
```

Không hard-code.

---

# 29. SECURITY

Kiểm tra:

```text
file type
file extension
file size
filename
path traversal
FFmpeg arguments
command injection
API validation
```

Không cho upload file thực thi.

---

# 30. VOICE CONSENT

Vì hệ thống có Voice Cloning, khi tạo voice hiển thị:

```text
I confirm that I own this voice or have permission
to use this voice.
```

Checkbox:

```text
☐ I confirm
```

Không cho Create Voice nếu chưa xác nhận.

---

# 31. UI SETTINGS

Settings:

```text
TTS Engine
Model
Device
CPU / GPU

Default Voice
Default Emotion
Default Speed

Audio Format
Sample Rate
MP3 Bitrate
```

---

# 32. SYSTEM INFORMATION

Trang Settings/System hiển thị:

```text
CPU
RAM
GPU
VRAM
Disk
CUDA
PyTorch
TTS Engine
Model
```

Ví dụ:

```text
CPU: AMD Ryzen
RAM: 32 GB

GPU: RTX 3060
VRAM: 12 GB

CUDA: 12.x

TTS Model:
Installed
```

---

# 33. PROJECT STRUCTURE

Tạo:

```text
text-to-speech/
│
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   │
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── engines/
│   │   └── workers/
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   ├── package.json
│   └── Dockerfile
│
├── data/
├── models/
├── storage/
│   ├── voices/
│   ├── generated/
│   └── temp/
│
├── docs/
│   ├── architecture.md
│   ├── tts-engine-comparison.md
│   └── api.md
│
├── tests/
│
├── docker-compose.yml
├── docker-compose.gpu.yml
├── .env.example
├── .gitignore
└── README.md
```

---

# 34. TEST CASE

Sau khi code xong, phải test flow thực tế.

## TEST 1 – CREATE VOICE

Upload:

```text
my_voice.wav
```

Nhập:

```text
My Voice
```

Nhấn:

```text
Create Voice
```

Expected:

```text
Voice created successfully
```

Database có:

```text
voice_id
name = My Voice
sample_path
embedding_path
```

---

# 35. TEST 2 – GENERATE

Chọn:

```text
Voice:
My Voice
```

Nhập:

```text
Xin chào mọi người! Đây là giọng nói của tôi.
```

Chọn:

```text
Emotion:
Friendly
```

Generate.

Expected:

```text
WAV created
MP3 created
```

Audio phải sử dụng voice profile:

```text
My Voice
```

---

# 36. TEST 3 – MULTIPLE VOICES

Tạo:

```text
Voice A
Voice B
Voice C
```

Mỗi voice có sample riêng.

Generate cùng một câu.

Kiểm tra output khác nhau.

---

# 37. TEST 4 – EMOTION

Generate cùng một text:

```text
Mọi người ơi! Hôm nay chúng ta có một tin vui!
```

với:

```text
Neutral
Happy
Excited
Serious
Sad
```

Kiểm tra output.

---

# 38. TEST 5 – MULTI SPEAKER

Input:

```text
My Voice:
Xin chào mọi người!

Voice B:
Xin chào!

My Voice:
Hôm nay chúng ta sẽ tổ chức một buổi tiệc.
```

Expected:

```text
Một file audio duy nhất
```

có nhiều voice.

---

# 39. KHÔNG ĐƯỢC MOCK

Đây là yêu cầu rất quan trọng.

Không được tạo:

```text
Fake TTS
Fake Voice Clone
Fake Generate
Fake Progress
Fake Download
```

Nếu nút:

```text
Generate
```

thì phải thực sự chạy TTS.

Nếu:

```text
Create Voice
```

thì phải thực sự tạo Voice Profile.

Nếu:

```text
Download
```

thì phải có file audio thật.

---

# 40. KHÔNG LOAD MODEL MỖI REQUEST

TTS model phải được:

```text
Load once
      ↓
Keep in worker memory
      ↓
Reuse
```

Không:

```text
HTTP Request
 ↓
Load model
 ↓
Generate
 ↓
Unload
```

vì sẽ rất chậm.

---

# 41. ERROR HANDLING

Nếu voice chưa có embedding:

```text
Voice profile is not ready.
Please rebuild the voice profile.
```

Nếu GPU thiếu VRAM:

```text
GPU memory is insufficient.
Try CPU mode or a smaller model.
```

Nếu audio không hợp lệ:

```text
Invalid voice sample.
Please upload a valid audio file.
```

---

# 42. README

README phải có:

```text
Project overview
Architecture
Requirements
Ubuntu 22.04 setup
Docker installation
CPU installation
GPU installation
NVIDIA Container Toolkit
First model download
Create voice
Voice cloning
Generate speech
Emotion
Multi-speaker
MP3/WAV
Storage
Backup
Logs
Troubleshooting
```

---

# 43. FIRST RUN

Sau:

```bash
docker compose up -d
```

truy cập:

```text
http://localhost:8000
```

Nếu model chưa có:

```text
Model not installed
```

Hiển thị:

```text
[ Download Model ]
```

Sau khi download:

```text
Model Ready
```

---

# 44. HEALTH CHECK

API:

```text
GET /api/health
```

Expected:

```json
{
  "status": "ok",
  "tts_engine": "ready",
  "model": "ready",
  "storage": "ok"
}
```

Docker healthcheck cũng phải được cấu hình.

---

# 45. IMPLEMENTATION RULES FOR ANTIGRAVITY

Không chỉ tạo skeleton.

Hãy:

1. Phân tích repository hiện tại.
2. Nếu project chưa tồn tại, tạo project.
3. Tạo toàn bộ source code.
4. Tạo Dockerfile.
5. Tạo Docker Compose.
6. Tạo database migration.
7. Tạo frontend.
8. Tạo backend.
9. Tích hợp TTS engine thật.
10. Tích hợp voice cloning thật.
11. Tích hợp FFmpeg.
12. Viết test.
13. Build Docker.
14. Chạy test.
15. Sửa lỗi build/runtime.
16. Kiểm tra API.
17. Kiểm tra frontend.
18. Cập nhật README.

Không dừng ở việc tạo file.

---

# 46. SAU KHI HOÀN THÀNH

Hãy tự kiểm tra:

```text
[ ] Backend chạy
[ ] Frontend chạy
[ ] Docker build thành công
[ ] Docker compose chạy thành công
[ ] Health API OK
[ ] TTS engine hoạt động
[ ] Model load thành công
[ ] Upload voice hoạt động
[ ] Voice profile tạo thành công
[ ] Voice embedding tạo thành công
[ ] Voice selection hoạt động
[ ] Emotion hoạt động
[ ] TTS generation hoạt động
[ ] MP3 hoạt động
[ ] WAV hoạt động
[ ] Audio player hoạt động
[ ] Download hoạt động
[ ] History hoạt động
[ ] Multi-speaker hoạt động
[ ] GPU mode hoạt động nếu có GPU
[ ] CPU fallback hoạt động nếu model hỗ trợ
```

Nếu gặp lỗi, **tự debug và sửa trước khi kết thúc**, không chỉ báo lỗi cho tôi.

---

# 47. KẾT QUẢ CUỐI CÙNG

Tôi muốn có một ứng dụng local:

```text
                 TEXT-TO-SPEECH
                       │
          ┌────────────┴────────────┐
          │                         │
      MY VOICES                   STUDIO
          │                         │
          ▼                         ▼
   Upload my voice             Select Voice
          │                         │
   Enter Voice Name            Enter Text
          │                         │
          ▼                    Select Emotion
   Create Voice Profile             │
          │                         │
          └────────────┬────────────┘
                       ▼
                  TTS ENGINE
                       │
                       ▼
                Generated Audio
                   /       \
                 WAV       MP3
```

Mục tiêu cuối cùng:

> **Tôi chỉ cần thu giọng của mình một lần, upload lên hệ thống, đặt tên cho giọng đó, sau này chọn tên giọng và nhập văn bản để hệ thống đọc bằng chính giọng của tôi.**

Hệ thống phải chạy local trên:

```text
Ubuntu 22.04
Docker
Python
React
TTS Open Source
```

và sau khi tải model về phải có khả năng chạy **offline**, không phụ thuộc API TTS trả phí.
