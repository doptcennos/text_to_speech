import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.tts_job import TTSJob
from app.models.voice import Voice
from app.models.audio_file import AudioFile
from app.schemas.tts import TTSGenerateRequest, TTSJobResponse, TTSQueueResponse
from app.workers import get_worker

router = APIRouter(prefix="/tts", tags=["Text-to-Speech"])

def _to_job_response(job: TTSJob, db: Session) -> TTSJobResponse:
    voice_name = None
    if job.voice_id:
        v = db.query(Voice).filter(Voice.id == job.voice_id).first()
        if v:
            voice_name = v.name

    audio_file = db.query(AudioFile).filter(AudioFile.job_id == job.id).first()
    audio_id = audio_file.id if audio_file else None
    audio_url = f"/api/audio/{audio_id}/stream" if audio_id else None
    wav_url = f"/api/audio/{audio_id}/download?format=wav" if audio_id else None
    mp3_url = f"/api/audio/{audio_id}/download?format=mp3" if audio_id else None
    duration = audio_file.duration if audio_file else None

    return TTSJobResponse(
        id=job.id,
        status=job.status,
        progress=job.progress,
        text=job.text,
        voice_id=job.voice_id,
        voice_name=voice_name,
        emotion=job.emotion,
        speed=job.speed,
        output_format=job.output_format,
        audio_id=audio_id,
        audio_url=audio_url,
        wav_url=wav_url,
        mp3_url=mp3_url,
        duration=duration,
        error_message=job.error_message,
        created_at=job.created_at,
        completed_at=job.completed_at
    )

@router.post("/generate", response_model=TTSQueueResponse, status_code=status.HTTP_202_ACCEPTED)
async def generate_speech(req: TTSGenerateRequest, db: Session = Depends(get_db)):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    # If not multi-speaker and voice_id provided, verify voice has embedding
    if not req.multi_speaker and req.voice_id:
        v = db.query(Voice).filter(Voice.id == req.voice_id).first()
        if not v:
            raise HTTPException(status_code=404, detail="Selected voice profile not found")
        if not v.embedding_path:
            raise HTTPException(
                status_code=400,
                detail="Voice profile is not ready. Please rebuild the voice profile."
            )

    is_multi = req.multi_speaker or bool(req.is_multi_speaker)
    
    # Extract speakers list flexibly
    speakers_list = req.speakers
    if not speakers_list and req.speaker_mapping:
        if isinstance(req.speaker_mapping, str):
            try:
                speakers_list = json.loads(req.speaker_mapping)
            except Exception:
                pass
        elif isinstance(req.speaker_mapping, list):
            speakers_list = req.speaker_mapping

    formatted_speakers = []
    if speakers_list:
        for s in speakers_list:
            if hasattr(s, "model_dump"):
                formatted_speakers.append(s.model_dump())
            elif isinstance(s, dict):
                formatted_speakers.append(s)

    speaker_mapping_json = json.dumps({
        "speakers": formatted_speakers,
        "read_speaker_names": bool(req.read_speaker_names)
    })

    job = TTSJob(
        text=req.text.strip(),
        voice_id=req.voice_id,
        emotion=req.emotion,
        emotion_intensity=req.emotion_intensity,
        speed=req.speed,
        pitch=req.pitch,
        output_format=req.output_format,
        speaker_mapping=speaker_mapping_json,
        status="QUEUED",
        progress=0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Enqueue to background worker
    worker = get_worker()
    await worker.enqueue_job(job.id)

    return TTSQueueResponse(
        job_id=job.id,
        status="QUEUED",
        progress=0,
        message="TTS job successfully queued"
    )

@router.get("/jobs", response_model=List[TTSJobResponse])
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(TTSJob).order_by(TTSJob.created_at.desc()).limit(100).all()
    return [_to_job_response(j, db) for j in jobs]

@router.get("/jobs/{id}", response_model=TTSJobResponse)
def get_job(id: str, db: Session = Depends(get_db)):
    job = db.query(TTSJob).filter(TTSJob.id == id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return _to_job_response(job, db)

@router.post("/jobs/{id}/cancel")
def cancel_job(id: str, db: Session = Depends(get_db)):
    worker = get_worker()
    success = worker.cancel_job(id, db)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot cancel job in current state")
    return {"status": "ok", "message": "Job cancelled"}
