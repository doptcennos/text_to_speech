# Nghiên cứu và So sánh TTS Engine Open-Source (Voice Cloning & Vietnamese)

Tài liệu này đánh giá chi tiết các hệ thống Text-to-Speech (TTS) mã nguồn mở hàng đầu nhằm lựa chọn giải pháp tối ưu cho ứng dụng Voice Cloning tiếng Việt chạy Local/Offline trên Ubuntu 22.04 với Docker, hỗ trợ cả CPU và GPU NVIDIA.

---

## 1. Tiêu chí Đánh giá
1. **Khả năng hỗ trợ Tiếng Việt (Vietnamese Support)**: Xử lý thanh điệu (huyền, sắc, hỏi, ngã, nặng), nguyên âm có dấu, ngữ điệu tự nhiên.
2. **Zero-Shot / Few-Shot Voice Cloning**: Tạo giọng nói tương tự với mẫu giọng thu âm từ 3–30 giây mà không cần finetuning lại toàn bộ mạng.
3. **Speaker Embedding / Representation**: Trích xuất và lưu trữ vector đặc trưng âm sắc người nói riêng biệt (embedding.bin) để tái sử dụng nhanh chóng.
4. **Điều chế Cảm xúc & Phong cách (Emotion / Prosody)**: Hỗ trợ các sắc thái cảm xúc (Happy, Excited, Sad, Angry, Whisper, Neutral...) qua acoustic features hoặc prompt style.
5. **Khả năng chạy Local & Hoàn toàn Offline**: Sau khi tải mô hình, không gửi bất kỳ dữ liệu nào ra ngoài Internet.
6. **Tương thích Phần cứng (Hardware Compatibility)**: Hỗ trợ GPU NVIDIA (CUDA) và có CPU Fallback mượt mà cho máy cấu hình phổ thông / VRAM thấp (< 4GB).
7. **Đóng gói Docker**: Đơn giản hóa cài đặt môi trường, không xung đột dependency C++/CUDA.
8. **Giấy phép Bản quyền (License)**: Giấy phép nguồn mở minh bạch (MIT, Apache 2.0, CPAL...).

---

## 2. Bảng So sánh Chi tiết các TTS Engine

| Tiêu chí | Coqui XTTS-v2 | F5-TTS / E2-TTS | GPT-SoVITS (v2/v3) | Fish Speech (1.4/1.5) | CosyVoice (Alibaba) | Piper TTS (Neural VITS) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Kiến trúc** | Autoregressive + HiFi-GAN / Tortoise hybrid | Non-autoregressive Flow Matching + DiT | Autoregressive LLM + VITS acoustic | Dual-autoregressive LLM + VQ-GAN | Multi-task Flow Matching + Speech LLM | VITS / ONNX End-to-End |
| **Tiếng Việt** | Khá (Cần Vietnamese tokenizer/phonemizer) | Rất Tốt (Multilingual / Character & IPA) | Cần checkpoint Finetuned tiếng Việt | Trung bình (Tập trung CN/EN) | Trung bình (Tập trung CN/EN/JP) | Xuất sắc (Checkpoint VIVOS/25hours chính thức) |
| **Voice Cloning** | Rất Tốt (3–6s sample audio, trích xuất d-vector) | Xuất sắc (Zero-shot reference audio) | Xuất sắc (3–5s sample audio) | Rất tốt (Dual-track zero-shot) | Rất tốt (Zero-shot voice clone) | Gián tiếp (Thông qua Voice Conversion / Speaker Adaptation) |
| **Speaker Embedding tách rời** | Có (speaker_embedding.pth / 512-d vector) | Có (Reference Latent Conditioner) | Có (Speaker reference spectrogram/code) | Có (VQ Latent vector) | Có (Prompt speech embedding) | Có (Speaker ID hoặc Voice conversion vector) |
| **Emotion / Prosody** | Hỗ trợ qua style conditioning & audio features | Rất tự nhiên theo reference audio & speed/pitch | Rất tốt theo emotion prompt | Tự nhiên theo LLM context | Rất tốt theo emotion instruction | Tùy chỉnh qua speed, noise_scale, pitch shifter |
| **Yêu cầu GPU VRAM** | 4GB – 8GB | 4GB – 8GB | 6GB – 12GB | 8GB – 16GB | 8GB – 12GB | < 1GB (Chạy cực nhanh trên CPU) |
| **Chạy trên CPU** | Khả thi (Chậm ~2–4x realtime) | Khả thi (với ONNX/Torch CPU) | Rất chậm trên CPU | Khó khả thi trên CPU | Chậm trên CPU | **Cực nhanh trên CPU (< 0.2x realtime)** |
| **Kích thước Model** | ~1.8 GB | ~1.2 GB | ~3.5 GB | ~5.0 GB | ~2.5 GB | **~50 MB – 100 MB** |
| **License** | Coqui Public Model License | MIT License | MIT License | Apache 2.0 | Apache 2.0 | MIT License |

---

## 3. Phân tích Chuyên sâu

### 3.1. Coqui XTTS-v2
- **Ưu điểm**: Là chuẩn mực cho Voice Cloning mã nguồn mở với hệ thống tách biệt Speaker Encoder và Text-to-Speech Decoder. Trích xuất speaker embedding 512 chiều từ file WAV chỉ mất vài trăm mili-giây.
- **Hạn chế**: Khi chạy trên máy tính cấu hình văn phòng hoặc VPS không có GPU NVIDIA mạnh (hoặc VRAM < 2GB), việc suy luận trên CPU tốn thời gian đáng kể.

### 3.2. F5-TTS
- **Ưu điểm**: Ra mắt cuối năm 2024, sử dụng Flow Matching loại bỏ hiện tượng ảo giác (hallucination) thường gặp ở mô hình autoregressive. Xử lý giọng nói tiếng Việt đa thanh điệu rất mượt mà.
- **Hạn chế**: Cần cấu hình PyTorch đồng bộ, phụ thuộc vào CUDA để đạt tốc độ cao nhất.

### 3.3. Piper TTS kết hợp Speaker Voice Transformation / FreeVC
- **Ưu điểm**: Siêu nhẹ, siêu ổn định, phát âm tiếng Việt chuẩn xác từng thanh điệu nhờ mô hình VIVOS / 25-hours được huấn luyện riêng biệt cho tiếng Việt. Tốc độ sinh âm thanh gần như tức thời ngay cả trên CPU thông thường.
- **Hạn chế**: Mô hình Piper gốc dùng cố định các speaker ID, cần tầng biến đổi âm sắc (Speaker Feature Projection / Voice Morphing) để mô phỏng chính xác đặc trưng tần số F0 và formants của người dùng.

---

## 4. Quyết định Kiến trúc & Động cơ Tuyển chọn (Selected Engine)

Để đáp ứng trọn vẹn cả **Section 39 (Không mock, thực tế 100%)**, **Section 25 (Hỗ trợ GPU lẫn CPU fallback trên máy RAM 8GB)** và **Section 11 (Voice Cloning trích xuất embedding thật)**:

Hệ thống được thiết kế với **Kiến trúc Engine Module mở rộng (Modular Engine Architecture)**:
1. **Giao diện chuẩn BaseTTSEngine**:
   - extract_speaker_embedding(audio_path: str) -> np.ndarray: Sử dụng mạng nơ-ron nhận diện sinh trắc âm thanh (Neural Speaker Verification / Resemblyzer / ECAPA-TDNN) để trích xuất vector đặc trưng tần phổ và formants của người dùng vào file embedding.bin.
   - synthesize(text, embedding_path, emotion, speed, pitch, ...): Điều chế thanh điệu tiếng Việt, phân tích ngữ điệu cảm xúc, và hòa trộn đặc trưng âm sắc từ speaker embedding.
2. **Engine Chính (Primary Neural Voice Clone Engine)**:
   - Tích hợp pipeline tổng hợp giọng nói tiếng Việt chuẩn thanh điệu, nạp một lần duy nhất vào bộ nhớ worker (Singleton Model Manager).
   - Cung cấp mô-đun speaker cloning qua vector âm sắc người dùng.
   - Hỗ trợ đầy đủ bộ tham số: emotion (14 sắc thái), emotion_intensity, speed (0.5x – 2.0x), pitch (-12 đến +12 semitones).
3. **Đóng gói Docker Offline**:
   - Tự động kiểm tra file model tại /storage/models/.
   - Hiển thị trạng thái rõ ràng tại trang Settings: Model not installed kèm nút [ Download Model ], và tự động chuyển sang Model Ready ngay sau khi tải.
