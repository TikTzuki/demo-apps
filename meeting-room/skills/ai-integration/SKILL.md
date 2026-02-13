# AI Integration Skill

Expert guidance for integrating AI services including LLMs, Text-to-Speech (TTS), and Speech-to-Text (STT).

## LLM Integration (Claude/OpenAI)

### Claude API (Anthropic)

```python
import anthropic
from typing import AsyncGenerator

class ClaudeService:
    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = "claude-sonnet-4-20250514"

    async def generate_response(
        self,
        messages: list[dict],
        system_prompt: str = "You are a helpful assistant."
    ) -> str:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_prompt,
            messages=messages
        )
        return response.content[0].text

    async def stream_response(
        self,
        messages: list[dict],
        system_prompt: str = "You are a helpful assistant."
    ) -> AsyncGenerator[str, None]:
        async with self.client.messages.stream(
            model=self.model,
            max_tokens=4096,
            system=system_prompt,
            messages=messages
        ) as stream:
            async for text in stream.text_stream:
                yield text
```

### OpenAI API

```python
from openai import AsyncOpenAI
from typing import AsyncGenerator

class OpenAIService:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = "gpt-4o"

    async def generate_response(self, messages: list[dict]) -> str:
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=4096
        )
        return response.choices[0].message.content

    async def stream_response(
        self,
        messages: list[dict]
    ) -> AsyncGenerator[str, None]:
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            max_tokens=4096,
            stream=True
        )
        async for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
```

## Speech-to-Text (STT)

### Browser Web Speech API (Frontend)

```typescript
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      setTranscript(prev => prev + final);
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    recognitionRef.current?.start();
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    isSupported: 'webkitSpeechRecognition' in window
  };
}
```

### OpenAI Whisper API (Backend)

```python
from openai import AsyncOpenAI
import tempfile
import aiofiles

class WhisperService:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def transcribe(self, audio_data: bytes, language: str = "en") -> str:
        # Write audio to temp file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_data)
            temp_path = f.name

        try:
            async with aiofiles.open(temp_path, "rb") as audio_file:
                transcript = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language
                )
            return transcript.text
        finally:
            import os
            os.unlink(temp_path)

    async def transcribe_with_timestamps(
        self,
        audio_data: bytes,
        language: str = "en"
    ) -> dict:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            f.write(audio_data)
            temp_path = f.name

        try:
            async with aiofiles.open(temp_path, "rb") as audio_file:
                transcript = await self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json",
                    timestamp_granularities=["word", "segment"]
                )
            return {
                "text": transcript.text,
                "segments": transcript.segments,
                "words": transcript.words
            }
        finally:
            import os
            os.unlink(temp_path)
```

## Text-to-Speech (TTS)

### Browser Web Speech API (Frontend)

```typescript
export function useTextToSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  const speak = useCallback((
    text: string,
    options?: {
      voice?: SpeechSynthesisVoice;
      rate?: number;
      pitch?: number;
      volume?: number;
    }
  ) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = options?.voice || voices[0];
    utterance.rate = options?.rate || 1;
    utterance.pitch = options?.pitch || 1;
    utterance.volume = options?.volume || 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const stop = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const pause = useCallback(() => {
    window.speechSynthesis.pause();
  }, []);

  const resume = useCallback(() => {
    window.speechSynthesis.resume();
  }, []);

  return {
    isSpeaking,
    voices,
    speak,
    stop,
    pause,
    resume,
    isSupported: 'speechSynthesis' in window
  };
}
```

### ElevenLabs API (Backend)

```python
import httpx
from typing import AsyncGenerator

class ElevenLabsService:
    BASE_URL = "https://api.elevenlabs.io/v1"

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.default_voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel

    async def text_to_speech(
        self,
        text: str,
        voice_id: str | None = None
    ) -> bytes:
        voice_id = voice_id or self.default_voice_id

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.BASE_URL}/text-to-speech/{voice_id}",
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            )
            response.raise_for_status()
            return response.content

    async def stream_text_to_speech(
        self,
        text: str,
        voice_id: str | None = None
    ) -> AsyncGenerator[bytes, None]:
        voice_id = voice_id or self.default_voice_id

        async with httpx.AsyncClient() as client:
            async with client.stream(
                "POST",
                f"{self.BASE_URL}/text-to-speech/{voice_id}/stream",
                headers={
                    "xi-api-key": self.api_key,
                    "Content-Type": "application/json"
                },
                json={
                    "text": text,
                    "model_id": "eleven_monolingual_v1",
                    "voice_settings": {
                        "stability": 0.5,
                        "similarity_boost": 0.75
                    }
                }
            ) as response:
                async for chunk in response.aiter_bytes():
                    yield chunk

    async def get_voices(self) -> list[dict]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/voices",
                headers={"xi-api-key": self.api_key}
            )
            response.raise_for_status()
            return response.json()["voices"]
```

### OpenAI TTS API (Backend)

```python
from openai import AsyncOpenAI

class OpenAITTSService:
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)

    async def text_to_speech(
        self,
        text: str,
        voice: str = "alloy",
        model: str = "tts-1"
    ) -> bytes:
        response = await self.client.audio.speech.create(
            model=model,
            voice=voice,
            input=text
        )
        return response.content

    async def stream_text_to_speech(
        self,
        text: str,
        voice: str = "alloy",
        model: str = "tts-1"
    ) -> AsyncGenerator[bytes, None]:
        async with self.client.audio.speech.with_streaming_response.create(
            model=model,
            voice=voice,
            input=text
        ) as response:
            async for chunk in response.iter_bytes():
                yield chunk
```

## Audio Streaming (WebSocket)

### Backend WebSocket Handler

```python
from fastapi import WebSocket
import asyncio

@app.websocket("/ws/audio/{user_id}")
async def audio_websocket(websocket: WebSocket, user_id: str):
    await websocket.accept()

    try:
        while True:
            # Receive audio chunk
            audio_chunk = await websocket.receive_bytes()

            # Process STT
            transcript = await whisper_service.transcribe(audio_chunk)

            if transcript:
                # Send transcript back
                await websocket.send_json({
                    "type": "transcript",
                    "text": transcript
                })

                # Generate AI response
                response = await ai_service.generate_response(transcript)

                # Stream TTS response
                async for audio_chunk in tts_service.stream_text_to_speech(response):
                    await websocket.send_bytes(audio_chunk)

                await websocket.send_json({"type": "audio_complete"})

    except Exception as e:
        await websocket.close(code=1000)
```

### Frontend Audio Streaming

```typescript
export function useAudioStream(wsUrl: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';

    ws.onopen = () => {
      setIsConnected(true);
      audioContextRef.current = new AudioContext();
    };

    ws.onmessage = async (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Play received audio
        const audioContext = audioContextRef.current;
        if (audioContext) {
          const audioBuffer = await audioContext.decodeAudioData(event.data);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start();
        }
      } else {
        // Handle JSON messages
        const data = JSON.parse(event.data);
        console.log('Received:', data);
      }
    };

    wsRef.current = ws;
  }, [wsUrl]);

  const sendAudio = useCallback((audioData: ArrayBuffer) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(audioData);
    }
  }, []);

  return { isConnected, connect, sendAudio };
}
```

## Best Practices

1. **Always stream responses** for better UX
2. **Implement retry logic** for API failures
3. **Cache common TTS phrases** to reduce API calls
4. **Use WebSocket** for real-time audio
5. **Validate audio files** before processing
6. **Handle rate limits** gracefully
7. **Log API usage** for monitoring costs
