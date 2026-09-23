# Hệ thống Text-to-Speech & Voice Cloning (Offline & Local)

> 🤖 **Tài liệu toàn diện cho AI Assistant / Developers**: Xem chi tiết kiến trúc, toàn bộ prompt thiết kế, quy chuẩn thẻ biểu thức và hướng dẫn chuyển máy tại [PROJECT_PROMPT.md](PROJECT_PROMPT.md).

Hệ thống chuyển đổi văn bản thành giọng nói (Text-to-Speech) và nhân bản giọng nói (Voice Cloning) mã nguồn mở, hoạt động hoàn toàn cục bộ (offline) trên Ubuntu 22.04 sử dụng Docker, không phụ thuộc vào bất kỳ Cloud API trả phí nào.

---

## 1. Tổng quan Dự án (Project Overview)

> **Mục tiêu**: Người dùng chỉ cần thu âm giọng nói của mình một lần (3 - 10 giây), tải lên hệ thống, đặt tên cho giọng đọc. Sau đó chọn giọng đọc này và nhập văn bản bất kỳ để hệ thống phát âm bằng chính âm sắc của mình, kết hợp 14 sắc thái cảm xúc và hỗ trợ kịch bản hội thoại nhiều người (multi-speaker dialogue).

### Điểm nổi bật:
- **Thực tế 100% (No Mocking)**: Trích xuất speaker embedding thật (vector 512 chiều) từ mẫu thu âm và tổng hợp âm thanh bằng mạng nơ-ron thực thụ.
- **Tối ưu bộ nhớ**: Model được nạp một lần duy nhất vào bộ nhớ worker (`Singleton`), tái sử dụng cho mọi yêu cầu, không load lại model gây trễ.
- **Xử lý âm thanh chuyên nghiệp**: Tích hợp FFmpeg chuẩn hóa âm lượng EBU R128, cắt khoảng lặng, xuất file WAV 16-bit 44.1kHz và MP3 bitrate cao (128k - 320k).
- **Điều chế cảm xúc**: 14 sắc thái biểu cảm (Neutral, Happy, Excited, Sad, Angry, Calm, Friendly, Serious, Confident, Shy, Funny, Warm, Sarcastic, Whisper) với thanh trượt cường độ Emotion Intensity.
- **Biểu thức văn bản**: Hỗ trợ các thẻ điều khiển tự nhiên: `[pause 500ms]`, `[laugh]`, `[whisper]`, `[excited]`, `[slow]`, `[fast]`.
- **Hội thoại nhiều người**: Cho phép gán từng nhân vật thoại cho các Voice Profile khác nhau trong một kịch bản duy nhất.

---

## 2. Kiến trúc Hệ thống (Architecture)

```text
Browser (React + TypeScript + Vite Studio UI)
                     │
                     ▼ HTTP REST & Web Stream
FastAPI Backend (Port 8000)
   ├── Voice Manager & Consent Validator
   ├── Background Job Queue & Persistent Worker
   ├── Neural Voice Clone Engine (Speaker Embedding + Prosody)
   ├── FFmpeg Audio Processor (Normalize, Concat, WAV/MP3)
   └── SQLite Database (ORM: voices, tts_jobs, audio_files)
                     │
                     ▼
Storage Volumes (/app/data, /app/storage, /app/models)
```

---

## 3. Yêu cầu Hệ thống (Requirements)

- **Hệ điều hành**: Ubuntu 22.04 LTS (hoặc WSL2 Ubuntu 22.04 trên Windows 10/11).
- **RAM**: Tối thiểu 4 GB (Khuyến nghị 8 GB trở lên).
- **Dung lượng ổ cứng**: Tối thiểu 5 GB dung lượng trống.
- **Docker & Docker Compose**: Docker Engine v24+ và Docker Compose v2+.
- **Card đồ họa (Tùy chọn)**: NVIDIA GPU với VRAM >= 2GB nếu muốn tăng tốc phần cứng. Nếu không có GPU, hệ thống tự động chạy chế độ CPU Fallback ổn định.

---

## 4. Hướng dẫn Cài đặt & Khởi chạy (Installation & Quick Start)

### 4.1. Chuẩn bị Môi trường Ubuntu 22.04
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin curl ffmpeg
sudo usermod -aG docker $USER
newgrp docker
```

### 4.2. Khởi chạy bằng Docker Compose (Chế độ CPU - Mặc định)
```bash
cd /opt/text_to_speech
docker compose up -d --build
```

Sau khi khởi chạy thành công:
- **Giao diện Web Studio**: [http://localhost](http://localhost) (Port 80)
- **FastAPI Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check API**: [http://localhost:8000/api/health](http://localhost:8000/api/health)

### 4.3. Khởi chạy với GPU NVIDIA (Chế độ GPU)
Yêu cầu đã cài đặt **NVIDIA Container Toolkit**:
```bash
# Cài đặt NVIDIA Container Toolkit trên Ubuntu 22.04:
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)    && curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg    && curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list |       sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' |       sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker

# Chạy Docker GPU:
docker compose -f docker-compose.gpu.yml up -d --build
```

---

## 5. Hướng dẫn Sử dụng (User Guide)

### Bước 1: Tạo Giọng Đọc của Bạn (My Voices)
1. Truy cập tab **My Voices** trên thanh điều hướng.
2. Nhấn nút **+ Add Voice**.
3. Điền Tên giọng đọc (ví dụ: `Giọng của tôi`), chọn ngôn ngữ `Vietnamese`.
4. Nhấn **Choose Audio** để tải lên file ghi âm mẫu (định dạng `.wav`, `.mp3`, `.m4a` hoặc `.flac`, thời lượng 3 - 15 giây).
5. Nhấn **Next: Consent & Create**.
6. Tại hộp thoại bản quyền, tích chọn:
   ```text
   [x] I confirm that I own this voice or have permission to use this voice.
   ```
7. Nhấn **Confirm & Create**. Hệ thống sẽ chuẩn hóa âm lượng và trích xuất vector `embedding.bin` lưu vào thư mục `storage/voices/<id>/`.

### Bước 2: Sinh Giọng Nói (Studio)
1. Chuyển sang tab **Studio**.
2. Nhập văn bản cần đọc. Có thể nhấn vào các biểu thức mẫu như `[pause 500ms]`, `[laugh]`, `[whisper]`, `[excited]`, `[slow]`, `[fast]`.
3. Tại cột bên phải:
   - Chọn giọng đọc vừa tạo.
   - Chọn cảm xúc (Emotion) và điều chỉnh cường độ (Emotion Intensity).
   - Tinh chỉnh tốc độ nói (Speaking Speed: 0.5x - 2.0x) và cao độ (Pitch Shift: -12 đến +12 bán âm).
   - Chọn định dạng đầu ra (MP3 hoặc WAV).
4. Nhấn **Generate Speech**.
5. Theo dõi thanh tiến trình (Progress Bar: 0% → 100%).
6. Khi hoàn thành, trình phát nhạc hiển thị sẵn sàng nghe thử, cùng các nút **Download WAV** và **Download MP3**.

### Bước 3: Kịch bản Hội thoại Nhiều Người (Multi-Speaker Mode)
1. Bật nút **+ Dialogue Mode**.
2. Nhập kịch bản theo định dạng:
   ```text
   Nguyen Van A:
   Xin chào mọi người!
   
   Voice B:
   Xin chào bạn, hôm nay chúng ta có kế hoạch gì?
   
   Nguyen Van A:
   Chúng ta sẽ bắt đầu dự án Text to Speech.
   ```
3. Nhấn **Add Speaker** để ánh xạ tên nhân vật với giọng đọc tương ứng.
4. Nhấn **Generate Speech** để tạo ra một file âm thanh duy nhất kết hợp cả hai giọng nói tự nhiên.

---

## 6. Lưu trữ & Sao lưu Dữ liệu (Storage & Backup)

Toàn bộ dữ liệu của hệ thống được gắn kết (mount) qua Docker volumes:
```text
storage/
├── voices/       # Mẫu âm thanh gốc, bản chuẩn hóa và embedding.bin của từng giọng
├── generated/    # File WAV và MP3 đã được tạo
├── temp/         # File trung gian khi ghép nối âm thanh (tự dọn dẹp)
└── models/       # Checkpoint mô hình AI chạy offline
data/
└── tts.db        # SQLite database lưu trữ metadata
```

Để sao lưu hệ thống, bạn chỉ cần sao lưu 2 thư mục `storage/` và `data/`:
```bash
tar -czvf tts_backup_$(date +%F).tar.gz storage/ data/
```

---

## 7. Giám sát Logs & Xử lý Sự cố (Troubleshooting)

### Xem Logs thời gian thực
```bash
# Xem logs của Backend
docker compose logs -f backend

# Xem logs của Frontend
docker compose logs -f frontend
```

### Các lỗi thường gặp và cách khắc phục:
1. **Lỗi `Voice profile is not ready. Please rebuild the voice profile.`**:
   - Vào tab **My Voices**, tìm giọng đọc và nhấn nút **Rebuild** để trích xuất lại embedding vector từ file mẫu.
2. **Lỗi `GPU memory is insufficient`**:
   - Nếu GPU VRAM dưới 2GB, hãy chuyển sang chạy bằng `docker compose up -d` (chế độ CPU) để tránh tràn bộ nhớ video.
3. **Kiểm tra trạng thái hệ thống**:
   - Truy cập tab **Settings** trên giao diện Web để xem trực quan thông số CPU, RAM, GPU, VRAM, CUDA và PyTorch.
   - Nhấn **Download Model** nếu mô hình chưa sẵn sàng.

---

## 8. Giấy phép (License)
Dự án được phân phối dưới giấy phép mã nguồn mở MIT License.
