from typing import List, Dict, Any

class EmotionService:
    """
    Manages supported emotions, prosody mappings, and descriptions.
    """
    
    SUPPORTED_EMOTIONS = [
        {"name": "Neutral", "label": "Bình thường / Tự nhiên", "description": "Ngữ điệu cân bằng, chuẩn mực"},
        {"name": "Happy", "label": "Vui vẻ", "description": "Tông giọng nâng cao, giàu năng lượng"},
        {"name": "Excited", "label": "Hào hứng / Phấn khích", "description": "Tốc độ nhanh, âm sắc rộn ràng"},
        {"name": "Sad", "label": "Buồn bã / Trầm lắng", "description": "Nhịp điệu chậm, trường độ kéo dài"},
        {"name": "Angry", "label": "Tức giận / Gay gắt", "description": "Năng lượng phát âm mạnh mẽ, nhấn mạnh thanh điệu"},
        {"name": "Calm", "label": "Điềm tĩnh / Nhẹ nhàng", "description": "Âm vực sâu, ổn định và thư thái"},
        {"name": "Friendly", "label": "Thân thiện / Cởi mở", "description": "Ngữ điệu tươi sáng, ấm áp"},
        {"name": "Serious", "label": "Nghiêm túc / Chuyên nghiệp", "description": "Tông trầm dứt khoát, chuẩn phong thái báo cáo"},
        {"name": "Confident", "label": "Tự tin / Quyết đoán", "description": "Nhấn nhá rõ ràng, phong thái thủ lĩnh"},
        {"name": "Shy", "label": "Ngại ngùng / Rụt rè", "description": "Âm lượng nhỏ nhẹ, nhịp điệu ngắt quãng"},
        {"name": "Funny", "label": "Hài hước / Dí dỏm", "description": "Biên độ tần số linh hoạt, vui tươi"},
        {"name": "Warm", "label": "Ấm áp / Truyền cảm", "description": "Âm sắc dày dặn, giàu cảm xúc"},
        {"name": "Sarcastic", "label": "Mỉa mai / Châm biếm", "description": "Ngữ điệu nhấn nhá đặc thù, kéo dài vần"},
        {"name": "Whisper", "label": "Thì thầm", "description": "Giảm âm lượng, tăng tỷ lệ âm gió (breathy/whisper)"}
    ]

    @classmethod
    def get_supported_emotions(cls) -> List[Dict[str, Any]]:
        return cls.SUPPORTED_EMOTIONS

    @classmethod
    def is_valid_emotion(cls, emotion_name: str) -> bool:
        return any(e["name"].lower() == emotion_name.lower() for e in cls.SUPPORTED_EMOTIONS)
