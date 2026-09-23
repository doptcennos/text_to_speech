import requests, os
API_BASE = 'http://localhost:8000/api'
mp3_dir = '/opt/text_to_speech/mp3'
voices = [
    ('1.Thùy_Tiên_Linh_Thực_tập_sinh__7879aaebd982.mp3', 'Thùy Tiên - Linh (Thực tập sinh)', 'Giọng nói trẻ trung, năng động, chuẩn tiếng Việt'),
    ('2.Thùy_Tiên_Hà_THỰC_TẬP_SINH_Sa_5a3ccd897ad8.mp3', 'Thùy Tiên - Hà (Thực tập sinh)', 'Giọng nói nhẹ nhàng, tự nhiên'),
    ('3.Thùy_Tiên_Chị_Mai_HR_Cười__abde129163ba.mp3', 'Thùy Tiên - Chị Mai (HR)', 'Giọng nói thân thiện, tươi vui, chuyên nghiệp'),
    ('4.Thùy_Tiên_Chị_Lan_Kế_toán__26c770e64b2c.mp3', 'Thùy Tiên - Chị Lan (Kế toán)', 'Giọng nói rõ ràng, chững chạc, nghiêm túc')
]
for fn, name, desc in voices:
    fp = os.path.join(mp3_dir, fn)
    if os.path.exists(fp):
        with open(fp, 'rb') as f:
            r = requests.post(API_BASE + '/voices', data={'name': name, 'description': desc, 'language': 'vi', 'consent': 'true'}, files=[('sample', (fn, f, 'audio/mpeg'))])
            print(name, r.status_code)
