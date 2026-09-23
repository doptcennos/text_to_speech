import asyncio
import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.tts_job import TTSJob
from app.services.tts_service import TTSService

logger = logging.getLogger(__name__)

class TTSWorker:
    """
    Asynchronous background job worker managing the TTS queue.
    Ensures model stays loaded in memory and tasks process sequentially/concurrently.
    """
    def __init__(self):
        self.queue: asyncio.Queue = asyncio.Queue()
        self._running: bool = False
        self._worker_task: Optional[asyncio.Task] = None
        self._active_job_id: Optional[str] = None

    async def start(self):
        if self._running:
            return
        self._running = True
        self._worker_task = asyncio.create_task(self._process_loop())
        logger.info("TTS Background Worker started.")

    async def stop(self):
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("TTS Background Worker stopped.")

    async def enqueue_job(self, job_id: str):
        await self.queue.put(job_id)
        logger.info(f"Job {job_id} enqueued. Queue size: {self.queue.qsize()}")

    def cancel_job(self, job_id: str, db: Session) -> bool:
        job = db.query(TTSJob).filter(TTSJob.id == job_id).first()
        if not job:
            return False
        if job.status in ("COMPLETED", "FAILED", "CANCELLED"):
            return False
        job.status = "CANCELLED"
        job.error_message = "Cancelled by user"
        job.completed_at = datetime.utcnow()
        db.commit()
        return True

    async def _process_loop(self):
        while self._running:
            try:
                job_id = await self.queue.get()
                self._active_job_id = job_id
                await self._execute_job(job_id)
                self.queue.task_done()
                self._active_job_id = None
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in TTS worker process loop: {e}")
                await asyncio.sleep(1)

    async def _execute_job(self, job_id: str):
        db: Session = SessionLocal()
        try:
            job = db.query(TTSJob).filter(TTSJob.id == job_id).first()
            if not job or job.status == "CANCELLED":
                return

            job.status = "PROCESSING"
            job.progress = 5
            db.commit()

            def update_progress(percent: int):
                # Update progress in db
                try:
                    job.progress = percent
                    db.commit()
                except Exception as ex:
                    logger.warning(f"Failed to update progress: {ex}")

            # Run synthesis in thread pool to avoid blocking the event loop
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                None,
                TTSService.process_job,
                db,
                job,
                update_progress
            )

            job.status = "COMPLETED"
            job.progress = 100
            job.completed_at = datetime.utcnow()
            db.commit()
            logger.info(f"Job {job_id} successfully completed.")

        except Exception as e:
            logger.error(f"Job {job_id} failed: {e}")
            if job:
                job.status = "FAILED"
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                db.commit()
        finally:
            db.close()

# Global worker instance
worker_instance = TTSWorker()

def get_worker() -> TTSWorker:
    return worker_instance
