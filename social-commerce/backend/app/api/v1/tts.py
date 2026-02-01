import os
import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from app.services.tts import GoogleTTSService, VietnameseVoice, VOICE_PRESETS

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize service (in production, use dependency injection)
GOOGLE_TTS_API_KEY = os.getenv("GOOGLE_TTS_API_KEY", "")
# Verify API key is loaded (without exposing it)
if GOOGLE_TTS_API_KEY:
    logger.info(f"Google TTS API key loaded (length: {len(GOOGLE_TTS_API_KEY)})")
else:
    logger.warning("GOOGLE_TTS_API_KEY not found in environment variables")


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000)
    voice: VietnameseVoice | None = None
    preset: str | None = Field(
        None,
        description="Voice preset: friendly, excited, calm, sleepy, surprised, love"
    )
    speaking_rate: float = Field(default=1.0, ge=0.25, le=4.0)
    pitch: float = Field(default=0.0, ge=-20.0, le=20.0)


@router.post("/synthesize")
async def synthesize_speech(request: TTSRequest) -> Response:
    """
    Synthesize Vietnamese speech using Google Cloud TTS.

    Returns MP3 audio bytes.
    """
    if not GOOGLE_TTS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="TTS service not configured. Set GOOGLE_TTS_API_KEY environment variable."
        )

    try:
        service = GoogleTTSService(GOOGLE_TTS_API_KEY)

        # Apply preset if specified
        voice = request.voice
        speaking_rate = request.speaking_rate
        pitch = request.pitch

        if request.preset and request.preset in VOICE_PRESETS:
            preset = VOICE_PRESETS[request.preset]
            voice = voice or preset["voice"]
            speaking_rate = preset["speaking_rate"]
            pitch = preset["pitch"]

        audio_bytes = await service.synthesize(
            text=request.text,
            voice=voice,
            speaking_rate=speaking_rate,
            pitch=pitch,
        )

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline",
                "Cache-Control": "public, max-age=3600",
            },
        )

    except Exception as e:
        logger.error(f"TTS synthesis failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to synthesize speech")


@router.get("/voices")
async def list_voices() -> dict:
    """List available Vietnamese voices."""
    if not GOOGLE_TTS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="TTS service not configured"
        )

    try:
        service = GoogleTTSService(GOOGLE_TTS_API_KEY)
        voices = await service.list_voices()

        return {
            "success": True,
            "data": {
                "voices": voices,
                "presets": list(VOICE_PRESETS.keys()),
            },
        }

    except Exception as e:
        logger.error(f"Failed to list voices: {e}")
        raise HTTPException(status_code=500, detail="Failed to list voices")
