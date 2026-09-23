# HỆ THỐNG TEXT-TO-SPEECH TIẾNG VIỆT & ZERO-SHOT VOICE CLONING CỤC BỘ (LOCAL ON-PREMISE)
> **Tài liệu lưu trữ Prompt, Đặc tả kỹ thuật & Hướng dẫn AI tiếp nhận dự án khi chuyển qua máy khác.**

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

Hệ thống **Text-to-Speech (TTS) Tiếng Việt Chuyên Nghiệp** chạy hoàn toàn cục bộ (100% Offline / On-Premise), không gửi dữ liệu ra ngoài, không phụ thuộc vào bất kỳ Cloud API trả phí nào (như Google, OpenAI, Azure, ElevenLabs).

### Mục tiêu cốt lõi:
1. **Chất lượng âm thanh tự nhiên, biểu cảm cao**: Giọng nói mượt mà, đúng ngữ điệu tiếng Việt (bắc/trung/nam, thanh điệu huyền/sắc/hỏi/ngã/nặng chuẩn xác).
2. **Sao chép giọng nói tức thì (Instant Zero-Shot Voice Cloning)**:
   - Cho phép tải lên file ghi âm mẫu (chỉ cần từ 10s đến 30s âm thanh sạch).
   - Trích xuất đặc trưng thanh quản, độ ấm, cao độ và phong cách phát âm của người nói.
   - Tạo ra giọng đọc mới giống đến 95%+ giọng thật mà không cần huấn luyện lại toàn bộ mô hình (no full fine-tuning needed).
3. **Tốc độ xử lý siêu tốc trên CPU thông thường**:
   - Sử dụng mô hình **VieNeu-TTS-v3-Nano** (mạng nơ-ron học sâu thế hệ mới dựa trên Flow Matching).
   - Tốc độ sinh âm thanh: **0.8 đến 1.5 giây cho một câu thoại** ngay trên CPU tiêu chuẩn (hỗ trợ tăng tốc GPU NVIDIA qua CUDA nếu có).
4. **Hệ thống biểu thức truyền cảm (Emotional & Prosody Expressions)**:
   - Cho phép chèn các thẻ ngắt nghỉ mili-giây, tiếng thở dài, hít sâu, cười, thì thầm, hào hứng, xúc động, đọc chậm, đọc nhanh,...
5. **Hội thoại đa nhân vật (Multi-Speaker Scripting)**:
   - Tự động phân vai kịch bản thoại (ví dụ: `Linh: ...`, `Chị Mai: ...`).
   - Tự động nhận diện và gán giọng đọc tương ứng (Smart Fuzzy Matching).
   - Tùy chọn đọc hoặc không đọc tên người thoại (`read_speaker_names`).
6. **Giao diện người dùng hiện đại**:
   - 100% Tiếng Việt, phong cách Glassmorphism Dark Mode cao cấp.
   - Chèn thẻ biểu thức thông minh ngay tại vị trí con trỏ chuột (`Smart Cursor Insertion`).

---

## 2. NGĂN XẾP CÔNG NGHỆ (TECH STACK)

### Backend
- **Ngôn ngữ**: Python 3.10+
- **Web Framework**: FastAPI, Uvicorn, Pydantic v2
- **Cơ sở dữ liệu**: SQLite (qua SQLAlchemy ORM)
- **Engine Học Sâu (Deep Learning & TTS Engines)**:
  - **Mô hình chính**: `VieNeu-TTS-v3-Nano` (Conditional Flow Matching ONNX Model by `pnnbao-ump` trên Hugging Face).
  - **Mô hình phụ trợ**: Piper VITS ONNX (`vi_VN-25hours_single-low`, `vi_VN-vivos-x_low`).
  - **Xử lý âm thanh**: `librosa`, `scipy`, `soundfile`, `pydub`, `ffmpeg`, `numpy`.
- **Hàng đợi tác vụ (Task Queue)**: In-memory async background worker quản lý trạng thái (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`).

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Vanilla Modern CSS (CSS Variables, Glassmorphism, Responsive Grid/Flexbox)
- **Icons**: Lucide React
- **Trình phát âm thanh**: AudioPlayer với thanh tiến trình tương tác, hiển thị dạng sóng (Waveform Visualizer), tua nhanh, điều chỉnh âm lượng, tải về MP3/WAV.

### Triển khai (Deployment)
- **Containerization**: Docker, Docker Compose
- **Web Server / Reverse Proxy**: Nginx Alpine
- **Cấu hình mạng**:
  - Frontend: `http://localhost` (Port 80)
  - Backend API: `http://localhost:8000` (Port 8000, API Docs tại `/docs`)

---

## 3. CƠ CHẾ KỸ THUẬT QUAN TRỌNG ĐÃ TRIỂN KHAI

### 3.1. Zero-Shot Voice Cloning Engine (`backend/app/engines/voice_clone_engine.py`)
- **Mã hóa âm sắc người nói (Pre-encoded Neural Profile Caching)**:
  - Khi người dùng tải lên file mẫu giọng (hoặc qua `init_samples.py`), module `encode_reference` xử lý âm thanh qua ONNX reference encoder để trích xuất:
    - `spk` (vector 192 chiều): đại diện cho đặc trưng sinh học thanh quản, cao độ, độ dày của giọng.
    - `style` (ma trận 50 x 256 chiều): đại diện cho tiết tấu, cách nhả chữ, ngữ điệu và hơi thở.
  - Cặp ma trận này được lưu trữ thành file `voice_clone.npz` trong thư mục giọng đọc (`storage/voices/<voice_id>/voice_clone.npz`).
- **Khởi tạo tức thì không độ trễ**:
  - Khi tổng hợp văn bản, hệ thống chỉ cần đọc trực tiếp `voice_clone.npz` từ đĩa và truyền vào mô hình Flow Matching. Quá trình này không cần mã hóa lại audio gốc, giảm thời gian sinh âm thanh xuống dưới 1 giây.
- **Tự động chuẩn hóa âm thanh đầu vào**:
  - Chuyển đổi mọi định dạng (MP3, M4A, WAV, OGG, FLAC) sang chuẩn `24kHz Mono 16-bit PCM`.
  - Cắt bỏ khoảng lặng đầu/cuối bằng thuật toán ngưỡng năng lượng RMS.
  - Tự động lặp/đệm nếu mẫu âm quá ngắn để đảm bảo độ dài tối thiểu cho mô hình.

### 3.2. Hệ thống phân tích biểu thức truyền cảm (`backend/app/services/tts_service.py`)
Mỗi câu văn bản được bộ tách cú pháp `parse_expressions` phân rã thành danh sách các phân đoạn:
1. **Phân đoạn ngắt nghỉ (Pause Segment)**:
   - `[nghỉ 300ms]`, `[nghỉ 500ms]`, `[nghỉ 1s]`, `[nghỉ 2s]` -> Sinh đoạn sóng im lặng chuẩn mili-giây.
2. **Phân đoạn hơi thở & tự nhiên (Breath Segment)**:
   - `[thở dài]` -> Sinh đoạn sóng breath 400ms và gán cảm xúc buồn (Sad).
   - `[hít sâu]` -> Sinh đoạn sóng breath 350ms mô phỏng nhịp lấy hơi tự nhiên trước khi nói.
   - `[hắng giọng]` -> Sinh đoạn tạm dừng 300ms kết hợp âm sắc điềm đạm, nghiêm túc.
3. **Phân đoạn cảm xúc (Emotion Override)**:
   - `[cười]` -> Chèn tiếng cười nhẹ "Haha" + cảm xúc Funny.
   - `[cười mỉm]` -> Cảm xúc Happy, tăng nhẹ 5% tốc độ.
   - `[thì thầm]` -> Cảm xúc Whisper, hạ biên độ âm thanh.
   - `[hào hứng]` -> Cảm xúc Excited, tăng năng lượng và cao độ.
   - `[ấm áp]` -> Cảm xúc Warm, âm điệu trầm ấm, truyền cảm.
   - `[xúc động]` -> Cảm xúc Sad/Touching, âm sắc nghẹn ngào.
   - `[nghiêm túc]` -> Cảm xúc Serious, nhịp điệu dứt khoát.
   - `[nhấn mạnh]` -> Cảm xúc Confident, tăng nội lực từng chữ.
   - `[ngập ngừng]` -> Nghỉ 450ms kết hợp tốc độ nói chậm 0.8x.
   - `[đọc chậm]` -> Tốc độ 0.75x.
   - `[đọc nhanh]` -> Tốc độ 1.30x.

### 3.3. Hội thoại đa nhân vật & Khớp tên thông minh (Multi-Speaker Scripting)
- **Định dạng văn bản**:
  ```text
  Linh (TTS Marketing): [hào hứng] Mọi người ơi! [nghỉ 300ms] Hôm nay...
  Hà (TTS Sales): [ngập ngừng] [thì thầm] Mà...
  Chị Mai (HR): [cười mỉm] [ấm áp] Yên tâm!...
  ```
- **Bộ phân giải kịch bản (`parse_multi_speaker_script`)**: Tách từng lượt thoại theo tiền tố `<Tên nhân vật>:`.
- **Khớp tên thông minh (`resolve_speaker_config`)**:
  - So khớp trực tiếp từ khóa (`linh`, `hà`, `mai`, `lan`) với danh sách các giọng đã tạo trong hệ thống.
  - Người dùng có thể viết `Linh (TTS Marketing):` hay `Em Linh:` hệ thống đều tự động gán giọng **Thùy Tiên - Linh (Thực tập sinh)**.
- **Tùy chọn đọc tên người thoại (`read_speaker_names`)**:
  - `read_speaker_names = False` (Mặc định lồng tiếng): AI chỉ đổi giọng theo nhân vật và đọc câu thoại (như phim chiếu rạp).
  - `read_speaker_names = True` (Đọc kịch bản/truyện): AI đọc cả tên nhân vật mở đầu trước khi vào câu thoại (ví dụ: *"Linh (TTS Marketing): [nghỉ 300ms] Mọi người ơi!..."*).

---

## 4. CẤU TRÚC THƯ MỤC DỰ ÁN (PROJECT STRUCTURE)

```
/opt/text_to_speech/
├── docker-compose.yml          # Cấu hình khởi chạy backend & frontend bằng Docker
├── docker-compose.gpu.yml      # Cấu hình hỗ trợ tăng tốc GPU NVIDIA (nếu có card rời)
├── .env.example                # File biến môi trường mẫu
├── .gitignore                  # Cấu hình loại trừ file rác, file tạm, cache
├── README.md                   # Tài liệu hướng dẫn sử dụng nhanh
├── PROJECT_PROMPT.md           # [FILE NÀY] Toàn bộ prompt, kiến trúc và đặc tả dự án
├── init_samples.py             # Script nạp tự động 4 giọng mẫu của Thùy Tiên
│
├── mp3/                        # 4 File ghi âm mẫu gốc của MC Thùy Tiên
│   ├── 1.Thùy_Tiên_Linh_Thực_tập_sinh__7879aaebd982.mp3
│   ├── 2.Thùy_Tiên_Hà_THỰC_TẬP_SINH_Sa_5a3ccd897ad8.mp3
│   ├── 3.Thùy_Tiên_Chị_Mai_HR_Cười__abde129163ba.mp3
│   └── 4.Thùy_Tiên_Chị_Lan_Kế_toán__26c770e64b2c.mp3
│
├── backend/                    # Mã nguồn máy chủ FastAPI
│   ├── Dockerfile              # Dockerfile môi trường Python 3.10 + ONNX + Audio libs
│   ├── requirements.txt        # Các thư viện Python cần thiết
│   └── app/
│       ├── api/                # Các endpoint REST API (voices, tts, audio, system)
│       │   ├── voices.py       # CRUD hồ sơ giọng đọc, upload sample
│       │   ├── tts.py          # API tạo job tổng hợp giọng, query trạng thái job
│       │   └── audio.py        # Stream và tải về file âm thanh kết quả
│       ├── engines/            # Các engine tổng hợp âm thanh
│       │   ├── base.py         # Interface trừu tượng BaseTTSEngine
│       │   └── voice_clone_engine.py # Engine Zero-Shot Flow Matching VieNeu-TTS
│       ├── models/             # Định nghĩa bảng cơ sở dữ liệu SQLAlchemy
│       │   ├── voice.py        # Bảng voices
│       │   ├── tts_job.py      # Bảng tts_jobs (kèm speaker_mapping metadata)
│       │   └── audio_file.py   # Bảng audio_files
│       ├── schemas/            # Pydantic schemas xác thực dữ liệu request/response
│       ├── services/           # Nghiệp vụ xử lý âm thanh và logic TTS
│       │   ├── audio_service.py # Cắt, chuẩn hóa, nén audio MP3/WAV
│       │   ├── tts_service.py   # Phân tích cú pháp biểu thức & kịch bản nhiều nhân vật
│       │   └── voice_service.py # Quản lý hồ sơ giọng và embedding
│       ├── workers/            # Bộ xử lý background worker cho các tác vụ nặng
│       ├── config.py           # Cấu hình hệ thống (Storage path, sample rate,...)
│       ├── database.py         # Kết nối cơ sở dữ liệu SQLite
│       └── main.py             # Điểm khởi động FastAPI application
│
├── frontend/                   # Ứng dụng giao diện React 18 + Vite
│   ├── Dockerfile              # Multi-stage build Node 20 -> Nginx Alpine
│   ├── nginx.conf              # Cấu hình Reverse Proxy Nginx chuyển tiếp API sang backend
│   ├── package.json            # Danh sách dependencies frontend
│   └── src/
│       ├── components/         # Các component giao diện dùng chung
│       │   ├── AudioPlayer.tsx # Trình phát âm thanh kèm thanh sóng và tải về
│       │   ├── JobProgress.tsx # Thanh tiến trình xử lý tác vụ
│       │   ├── MultiSpeakerEditor.tsx # Bảng cấu hình nhân vật kịch bản đối thoại
│       │   └── VoiceModal.tsx  # Modal thêm mới / ghi âm giọng đọc
│       ├── pages/
│       │   ├── Studio.tsx      # Trang phòng thu chính (nhập văn bản, biểu thức, đa thoại)
│       │   ├── Voices.tsx      # Trang quản lý danh sách hồ sơ giọng đọc
│       │   ├── History.tsx     # Trang lịch sử các bản thu đã tạo
│       │   └── Settings.tsx    # Cài đặt hệ thống
│       └── services/
│           └── api.ts          # Module gọi REST API backend
│
└── storage/                    # Thư mục lưu trữ dữ liệu (được mount volume ra ngoài Docker)
    ├── models/                 # Thư mục chứa các mô hình TTS offline
    ├── voices/                 # Thư mục chứa profile giọng (`voice_clone.npz`)
    ├── generated/              # Thư mục chứa file âm thanh kết quả đã tạo
    └── temp/                   # Thư mục tạm thời xử lý các phân đoạn âm thanh
```

---

## 5. HƯỚNG DẪN CÀI ĐẶT & CHẠY TRÊN MÁY MỚI (MIGRATION GUIDE)

Khi clone hoặc copy thư mục dự án sang một máy tính khác:

### Bước 1: Yêu cầu môi trường
- Hệ điều hành: Linux (Ubuntu 20.04/22.04), Windows 10/11 (WSL2), hoặc macOS.
- Đã cài đặt **Docker** và **Docker Compose**.
- Không bắt buộc GPU rời (chạy mượt trên CPU).

### Bước 2: Khởi động hệ thống bằng Docker Compose
Mở terminal tại thư mục gốc của dự án:
```bash
docker compose up -d --build
```
Lệnh này sẽ:
1. Build backend container với đầy đủ thư viện âm thanh và ONNX Runtime.
2. Build frontend React và khởi chạy Nginx phục vụ web.
3. Khi container backend khởi động lần đầu, nó sẽ tự động tải trọng số mô hình `VieNeu-TTS-v3-Nano` từ Hugging Face vào cache (chỉ tải một lần duy nhất, sau đó hoạt động 100% offline).

### Bước 3: Nạp 4 giọng đọc Thùy Tiên mẫu
Sau khi container backend đã khởi động (khoảng 15-30 giây):
```bash
# Chạy script nạp sẵn 4 giọng Thùy Tiên vào cơ sở dữ liệu và mã hóa neural profile
python3 init_samples.py
```
Kết quả hiển thị `201 Created` cho cả 4 giọng:
- `Thùy Tiên - Linh (Thực tập sinh)`
- `Thùy Tiên - Hà (Thực tập sinh)`
- `Thùy Tiên - Chị Mai (HR)`
- `Thùy Tiên - Chị Lan (Kế toán)`

### Bước 4: Truy cập ứng dụng
- **Giao diện phòng thu Web**: [http://localhost](http://localhost)
- **API Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 6. HƯỚNG DẪN CHO AI ASSISTANT KHI TIẾP QUẢN DỰ ÁN (FOR AI CODING AGENTS)

Khi một AI mới (hoặc subagent) tiếp nhận dự án này để bảo trì hoặc phát triển tính năng mới, vui lòng tuân thủ nghiêm ngặt các nguyên tắc sau:

1. **Giữ nguyên tính năng Local & On-Premise**:
   - TUYỆT ĐỐI KHÔNG thay thế engine bằng các thư viện gọi Cloud API bên ngoài (như OpenAI TTS API, ElevenLabs API, Google Cloud Text-to-Speech API). Toàn bộ kiến trúc được thiết kế cho doanh nghiệp/cá nhân muốn bảo mật dữ liệu và chạy offline.
2. **Ngôn ngữ giao diện**:
   - Toàn bộ giao diện người dùng (nhãn, nút bấm, thông báo lỗi, gợi ý) PHẢI luôn là **Tiếng Việt**.
3. **Quản lý Profile Zero-Shot Voice Cloning**:
   - Profile âm sắc được lưu trong file `storage/voices/<voice_id>/voice_clone.npz`. File này chứa 2 key: `'spk'` (192 floats) và `'style'` (50x256 floats). Khi thêm tính năng liên quan đến voice clone, luôn bảo toàn tính năng đọc và ghi file này trong `voice_clone_engine.py`.
4. **Quy tắc Props Component React**:
   - `JobProgress`: Nhận props `{ progress: number, status: string, onCancel?: () => void }`. Không truyền `{ job: activeJob }`.
   - `AudioPlayer`: Nhận props `{ streamUrl: string, wavUrl?: string, mp3Url?: string, voiceName?: string, emotion?: string, duration?: number }`. Không truyền `{ audioUrl: ... }`.
5. **Cấu trúc dữ liệu API TTS Request**:
   - Endpoint: `POST /api/tts/generate`
   - Request Body: Hỗ trợ cả `multi_speaker` (bool) và `is_multi_speaker` (bool), `speakers` (array) và `speaker_mapping` (string/array), cùng cờ `read_speaker_names` (bool).
6. **Không commit file rác vào Git**:
   - Không commit file `.wav`, `.mp3` trong `storage/generated/`, `storage/temp/`, hoặc file cơ sở dữ liệu `data/tts.db`. File `.gitignore` đã được cấu hình chặt chẽ để đảm bảo repository sạch sẽ và dung lượng nhẹ.

---
*Dự án đã được kiểm thử end-to-end hoàn tất, hoạt động ổn định và sẵn sàng đồng bộ lên Git repository.*
