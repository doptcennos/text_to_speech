import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.audio_file import AudioFile
from app.models.tts_job import TTSJob
from app.schemas.audio import AudioFileResponse
from app.config import settings

router = APIRouter(prefix="/audio", tags=["Audio"])

def _to_response(a: AudioFile) -> AudioFileResponse:
    return AudioFileResponse(
        id=a.id,
        job_id=a.job_id,
        format=a.format,
        duration=a.duration,
        size=a.size,
        stream_url=f"/api/audio/{a.id}/stream",
        download_url=f"/api/audio/{a.id}/download?format={a.format}",
        created_at=a.created_at
    )

@router.get("", response_model=List[AudioFileResponse])
def list_audios(db: Session = Depends(get_db)):
    audios = db.query(AudioFile).order_by(AudioFile.created_at.desc()).limit(100).all()
    return [_to_response(a) for a in audios]

@router.get("/{id}", response_model=AudioFileResponse)
def get_audio(id: str, db: Session = Depends(get_db)):
    audio = db.query(AudioFile).filter(AudioFile.id == id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio file record not found")
    return _to_response(audio)

@router.get("/{id}/stream")
def stream_audio(id: str, db: Session = Depends(get_db)):
    audio = db.query(AudioFile).filter(AudioFile.id == id).first()
    if not audio or not os.path.exists(audio.file_path):
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    media_type = "audio/mpeg" if audio.format.lower() == "mp3" else "audio/wav"
    return FileResponse(
        path=audio.file_path,
        media_type=media_type,
        filename=os.path.basename(audio.file_path)
    )

@router.get("/{id}/download")
def download_audio(
    id: str,
    format: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    audio = db.query(AudioFile).filter(AudioFile.id == id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")

    target_format = (format or audio.format).lower()
    file_path = os.path.join(settings.STORAGE_PATH, "generated", f"{audio.job_id}.{target_format}")

    if not os.path.exists(file_path):
        file_path = audio.file_path

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    media_type = "audio/mpeg" if target_format == "mp3" else "audio/wav"
    filename = f"tts_{audio.job_id[:8]}.{target_format}"

    return FileResponse(
        path=file_path,
        media_type=media_type,
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_audio(id: str, db: Session = Depends(get_db)):
    audio = db.query(AudioFile).filter(AudioFile.id == id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")

    for ext in ("wav", "mp3"):
        fpath = os.path.join(settings.STORAGE_PATH, "generated", f"{audio.job_id}.{ext}")
        if os.path.exists(fpath):
            try:
                os.remove(fpath)
            except Exception:
                pass

    job_id = audio.job_id
    db.delete(audio)
    
    if job_id:
        job = db.query(TTSJob).filter(TTSJob.id == job_id).first()
        if job:
            db.delete(job)

    db.commit()
    return None
