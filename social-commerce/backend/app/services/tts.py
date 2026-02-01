import base64
import logging
from enum import Enum

import httpx

logger = logging.getLogger(__name__)


class VietnameseVoice(str, Enum):
    """High-quality Vietnamese voices from Google Cloud TTS."""

    # Neural2 voices (highest quality)
    NEURAL2_A = "vi-VN-Neural2-A"  # Female
    NEURAL2_D = "vi-VN-Neural2-D"  # Male

    # WaveNet voices (high quality)
    WAVENET_A = "vi-VN-Wavenet-A"  # Female
    WAVENET_B = "vi-VN-Wavenet-B"  # Male
    WAVENET_C = "vi-VN-Wavenet-C"  # Female
    WAVENET_D = "vi-VN-Wavenet-D"  # Male

    # Standard voices (lower cost)
    STANDARD_A = "vi-VN-Standard-A"  # Female
    STANDARD_B = "vi-VN-Standard-B"  # Male
    STANDARD_C = "vi-VN-Standard-C"  # Female
    STANDARD_D = "vi-VN-Standard-D"  # Male


class GoogleTTSService:
    """Google Cloud Text-to-Speech service for Vietnamese."""

    BASE_URL = "https://texttospeech.googleapis.com/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        # Use male Neural2-D voice for witty, humorous character
        self.default_voice = VietnameseVoice.NEURAL2_D

    async def synthesize(
            self,
            text: str,
            voice: VietnameseVoice | None = None,
            speaking_rate: float = 1.0,
            pitch: float = 0.0,
    ) -> bytes:
        """
        Synthesize speech from text.

        Args:
            text: The text to synthesize
            voice: Vietnamese voice to use (defaults to Neural2-A female)
            speaking_rate: Speed of speech (0.25 to 4.0, default 1.0)
            pitch: Voice pitch (-20.0 to 20.0 semitones, default 0.0)

        Returns:
            MP3 audio bytes
        """
        voice_name = voice.value if voice else self.default_voice.value

        payload = {
            "input": {"text": text},
            "voice": {
                "languageCode": "vi-VN",
                "name": voice_name,
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "speakingRate": speaking_rate,
                "pitch": pitch,
                # Effects for more natural sound
                "effectsProfileId": ["small-bluetooth-speaker-class-device"],
            },
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/text:synthesize",
                params={"key": self.api_key},
                json=payload,
                timeout=30.0,
            )
            response.raise_for_status()

            data = response.json()
            audio_content = data.get("audioContent", "")

            return base64.b64decode(audio_content)

    async def list_voices(self) -> list[dict]:
        """List all available Vietnamese voices."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/voices",
                params={"key": self.api_key, "languageCode": "vi-VN"},
                timeout=10.0,
            )
            response.raise_for_status()

            data = response.json()
            return data.get("voices", [])


# Voice presets for different moods/contexts
# Using male Neural2-D voice with witty, humorous personality
VOICE_PRESETS = {
    "friendly": {
        "voice": VietnameseVoice.NEURAL2_D,
        "speaking_rate": 1.05,
        "pitch": 1.0,
    },
    "excited": {
        "voice": VietnameseVoice.WAVENET_B,
        "speaking_rate": 1.2,
        "pitch": 3.0,
    },
    "calm": {
        "voice": VietnameseVoice.WAVENET_D,
        "speaking_rate": 0.95,
        "pitch": -1.0,
    },
    "sleepy": {
        "voice": VietnameseVoice.NEURAL2_D,
        "speaking_rate": 0.85,
        "pitch": -2.0,
    },
    "surprised": {
        "voice": VietnameseVoice.STANDARD_B,
        "speaking_rate": 1.15,
        "pitch": 4.0,
    },
    "love": {
        "voice": VietnameseVoice.STANDARD_D,
        "speaking_rate": 1.0,
        "pitch": 2.0,
    },
}
