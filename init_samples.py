import requests, os
API_BASE = 'http://localhost:8000/api'
mp3_dir = '/opt/text_to_speech/mp3'
voices = [
]
for fn, name, desc in voices:
    fp = os.path.join(mp3_dir, fn)
    if os.path.exists(fp):
        with open(fp, 'rb') as f:
            r = requests.post(API_BASE + '/voices', data={'name': name, 'description': desc, 'language': 'vi', 'consent': 'true'}, files=[('sample', (fn, f, 'audio/mpeg'))])
            print(name, r.status_code)
