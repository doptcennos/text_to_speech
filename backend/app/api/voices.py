import os
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.voice import Voice
from app.schemas.voice import VoiceResponse, VoiceUpdate
from app.services.voice_service import VoiceService

router = APIRouter(prefix="/voices", tags=["Voices"])

def _to_response(v: Voice) -> VoiceResponse:
    has_sample = bool(v.sample_path and os.path.exists(v.sample_path))
    has_embedding = bool(v.embedding_path and os.path.exists(v.embedding_path))
    return VoiceResponse(
        id=v.id,
        name=v.name,
        description=v.description,
        language=v.language,
        engine=v.engine,
        model=v.model,
        sample_path=v.sample_path,
        embedding_path=v.embedding_path,
        has_sample=has_sample,
        has_embedding=has_embedding,
        created_at=v.created_at,
        updated_at=v.updated_at
    )

@router.get("", response_model=List[VoiceResponse])
def list_voices(db: Session = Depends(get_db)):
    voices = VoiceService.get_all_voices(db)
    return [_to_response(v) for v in voices]

@router.post("", response_model=VoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_voice(
    name: str = Form(...),
    description: Optional[str] = Form(None),
    language: str = Form("vi"),
    consent: bool = Form(...),
    sample: Optional[UploadFile] = File(None),
    samples: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    # Collect files from either sample or samples
    files_to_process: List[UploadFile] = []
    if samples:
        files_to_process.extend(samples)
    if sample:
        files_to_process.append(sample)

    if not files_to_process:
        raise HTTPException(
            status_code=400,
            detail="Vui lòng tải lên ít nhất một file âm thanh mẫu."
        )

    voice = await VoiceService.create_voice_with_samples(
        db=db,
        name=name,
        description=description,
        language=language,
        consent=consent,
        sample_files=files_to_process
    )
    return _to_response(voice)

@router.get("/{id}", response_model=VoiceResponse)
def get_voice(id: str, db: Session = Depends(get_db)):
    voice = VoiceService.get_voice_by_id(db, id)
    if not voice:
        raise HTTPException(status_code=404, detail="Không tìm thấy giọng đọc")
    return _to_response(voice)

@router.put("/{id}", response_model=VoiceResponse)
def update_voice(id: str, voice_in: VoiceUpdate, db: Session = Depends(get_db)):
    voice = VoiceService.update_voice(db, id, voice_in)
    return _to_response(voice)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_voice(id: str, db: Session = Depends(get_db)):
    VoiceService.delete_voice(db, id)
    return None

@router.post("/{id}/sample", response_model=VoiceResponse)
async def update_voice_sample(
    id: str,
    sample: Optional[UploadFile] = File(None),
    samples: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db)
):
    voice = VoiceService.get_voice_by_id(db, id)
    if not voice:
        raise HTTPException(status_code=404, detail="Không tìm thấy giọng đọc")

    files_to_process: List[UploadFile] = []
    if samples:
        files_to_process.extend(samples)
    if sample:
        files_to_process.append(sample)

    if not files_to_process:
        raise HTTPException(status_code=400, detail="Vui lòng tải lên ít nhất một file âm thanh.")

    voice = await VoiceService.create_voice_with_samples(
        db=db,
        name=voice.name,
        description=voice.description,
        language=voice.language,
        consent=True,
        sample_files=files_to_process
    )
    return _to_response(voice)

@router.post("/{id}/rebuild-embedding", response_model=VoiceResponse)
def rebuild_embedding(id: str, db: Session = Depends(get_db)):
    voice = VoiceService.rebuild_embedding(db, id)
    return _to_response(voice)
