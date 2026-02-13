[//]: # (# AI Integration Skill)

[//]: # ()

[//]: # (Expert guidance for integrating AI services including LLMs, Text-to-Speech &#40;TTS&#41;, and Speech-to-Text &#40;STT&#41;.)

[//]: # ()

[//]: # (## LLM Integration &#40;Claude/OpenAI&#41;)

[//]: # ()

[//]: # (### Claude API &#40;Anthropic&#41;)

[//]: # ()

[//]: # (```python)

[//]: # (import anthropic)

[//]: # (from typing import AsyncGenerator)

[//]: # ()

[//]: # (class ClaudeService:)

[//]: # (    def __init__&#40;self, api_key: str&#41;:)

[//]: # (        self.client = anthropic.AsyncAnthropic&#40;api_key=api_key&#41;)

[//]: # (        self.model = "claude-sonnet-4-20250514")

[//]: # ()

[//]: # (    async def generate_response&#40;)

[//]: # (        self,)

[//]: # (        messages: list[dict],)

[//]: # (        system_prompt: str = "You are a helpful assistant.")

[//]: # (    &#41; -> str:)

[//]: # (        response = await self.client.messages.create&#40;)

[//]: # (            model=self.model,)

[//]: # (            max_tokens=4096,)

[//]: # (            system=system_prompt,)

[//]: # (            messages=messages)

[//]: # (        &#41;)

[//]: # (        return response.content[0].text)

[//]: # ()

[//]: # (    async def stream_response&#40;)

[//]: # (        self,)

[//]: # (        messages: list[dict],)

[//]: # (        system_prompt: str = "You are a helpful assistant.")

[//]: # (    &#41; -> AsyncGenerator[str, None]:)

[//]: # (        async with self.client.messages.stream&#40;)

[//]: # (            model=self.model,)

[//]: # (            max_tokens=4096,)

[//]: # (            system=system_prompt,)

[//]: # (            messages=messages)

[//]: # (        &#41; as stream:)

[//]: # (            async for text in stream.text_stream:)

[//]: # (                yield text)

[//]: # (```)

[//]: # ()

[//]: # (### OpenAI API)

[//]: # ()

[//]: # (```python)

[//]: # (from openai import AsyncOpenAI)

[//]: # (from typing import AsyncGenerator)

[//]: # ()

[//]: # (class OpenAIService:)

[//]: # (    def __init__&#40;self, api_key: str&#41;:)

[//]: # (        self.client = AsyncOpenAI&#40;api_key=api_key&#41;)

[//]: # (        self.model = "gpt-4o")

[//]: # ()

[//]: # (    async def generate_response&#40;self, messages: list[dict]&#41; -> str:)

[//]: # (        response = await self.client.chat.completions.create&#40;)

[//]: # (            model=self.model,)

[//]: # (            messages=messages,)

[//]: # (            max_tokens=4096)

[//]: # (        &#41;)

[//]: # (        return response.choices[0].message.content)

[//]: # ()

[//]: # (    async def stream_response&#40;)

[//]: # (        self,)

[//]: # (        messages: list[dict])

[//]: # (    &#41; -> AsyncGenerator[str, None]:)

[//]: # (        stream = await self.client.chat.completions.create&#40;)

[//]: # (            model=self.model,)

[//]: # (            messages=messages,)

[//]: # (            max_tokens=4096,)

[//]: # (            stream=True)

[//]: # (        &#41;)

[//]: # (        async for chunk in stream:)

[//]: # (            if chunk.choices[0].delta.content:)

[//]: # (                yield chunk.choices[0].delta.content)

[//]: # (```)

[//]: # ()

[//]: # (## Speech-to-Text &#40;STT&#41;)

[//]: # ()

[//]: # (### Browser Web Speech API &#40;Frontend&#41;)

[//]: # ()

[//]: # (```typescript)

[//]: # (export function useSpeechRecognition&#40;&#41; {)

[//]: # (  const [isListening, setIsListening] = useState&#40;false&#41;;)

[//]: # (  const [transcript, setTranscript] = useState&#40;''&#41;;)

[//]: # (  const [interimTranscript, setInterimTranscript] = useState&#40;''&#41;;)

[//]: # (  const recognitionRef = useRef<SpeechRecognition | null>&#40;null&#41;;)

[//]: # ()

[//]: # (  useEffect&#40;&#40;&#41; => {)

[//]: # (    if &#40;!&#40;'webkitSpeechRecognition' in window&#41;&#41; {)

[//]: # (      console.warn&#40;'Speech recognition not supported'&#41;;)

[//]: # (      return;)

[//]: # (    })

[//]: # ()

[//]: # (    const recognition = new webkitSpeechRecognition&#40;&#41;;)

[//]: # (    recognition.continuous = true;)

[//]: # (    recognition.interimResults = true;)

[//]: # (    recognition.lang = 'en-US';)

[//]: # ()

[//]: # (    recognition.onresult = &#40;event&#41; => {)

[//]: # (      let interim = '';)

[//]: # (      let final = '';)

[//]: # ()

[//]: # (      for &#40;let i = event.resultIndex; i < event.results.length; i++&#41; {)

[//]: # (        const result = event.results[i];)

[//]: # (        if &#40;result.isFinal&#41; {)

[//]: # (          final += result[0].transcript;)

[//]: # (        } else {)

[//]: # (          interim += result[0].transcript;)

[//]: # (        })

[//]: # (      })

[//]: # ()

[//]: # (      setTranscript&#40;prev => prev + final&#41;;)

[//]: # (      setInterimTranscript&#40;interim&#41;;)

[//]: # (    };)

[//]: # ()

[//]: # (    recognition.onerror = &#40;event&#41; => {)

[//]: # (      console.error&#40;'Speech recognition error:', event.error&#41;;)

[//]: # (      setIsListening&#40;false&#41;;)

[//]: # (    };)

[//]: # ()

[//]: # (    recognitionRef.current = recognition;)

[//]: # (  }, []&#41;;)

[//]: # ()

[//]: # (  const startListening = useCallback&#40;&#40;&#41; => {)

[//]: # (    setTranscript&#40;''&#41;;)

[//]: # (    setInterimTranscript&#40;''&#41;;)

[//]: # (    recognitionRef.current?.start&#40;&#41;;)

[//]: # (    setIsListening&#40;true&#41;;)

[//]: # (  }, []&#41;;)

[//]: # ()

[//]: # (  const stopListening = useCallback&#40;&#40;&#41; => {)

[//]: # (    recognitionRef.current?.stop&#40;&#41;;)

[//]: # (    setIsListening&#40;false&#41;;)

[//]: # (  }, []&#41;;)

[//]: # ()

[//]: # (  return {)

[//]: # (    isListening,)

[//]: # (    transcript,)

[//]: # (    interimTranscript,)

[//]: # (    startListening,)

[//]: # (    stopListening,)

[//]: # (    isSupported: 'webkitSpeechRecognition' in window)

[//]: # (  };)

[//]: # (})

[//]: # (```)

[//]: # ()

[//]: # (### OpenAI Whisper API &#40;Backend&#41;)

[//]: # ()

[//]: # (```python)

[//]: # (from openai import AsyncOpenAI)

[//]: # (import tempfile)

[//]: # (import aiofiles)

[//]: # ()

[//]: # (class WhisperService:)

[//]: # (    def __init__&#40;self, api_key: str&#41;:)

[//]: # (        self.client = AsyncOpenAI&#40;api_key=api_key&#41;)

[//]: # ()

[//]: # (    async def transcribe&#40;self, audio_data: bytes, language: str = "en"&#41; -> str:)

[//]: # (        # Write audio to temp file)

[//]: # (        with tempfile.NamedTemporaryFile&#40;suffix=".wav", delete=False&#41; as f:)

[//]: # (            f.write&#40;audio_data&#41;)

[//]: # (            temp_path = f.name)

[//]: # ()

[//]: # (        try:)

[//]: # (            async with aiofiles.open&#40;temp_path, "rb"&#41; as audio_file:)

[//]: # (                transcript = await self.client.audio.transcriptions.create&#40;)

[//]: # (                    model="whisper-1",)

[//]: # (                    file=audio_file,)

[//]: # (                    language=language)

[//]: # (                &#41;)

[//]: # (            return transcript.text)

[//]: # (        finally:)

[//]: # (            import os)

[//]: # (            os.unlink&#40;temp_path&#41;)

[//]: # ()

[//]: # (    async def transcribe_with_timestamps&#40;)

[//]: # (        self,)

[//]: # (        audio_data: bytes,)

[//]: # (        language: str = "en")

[//]: # (    &#41; -> dict:)

[//]: # (        with tempfile.NamedTemporaryFile&#40;suffix=".wav", delete=False&#41; as f:)

[//]: # (            f.write&#40;audio_data&#41;)

[//]: # (            temp_path = f.name)

[//]: # ()

[//]: # (        try:)

[//]: # (            async with aiofiles.open&#40;temp_path, "rb"&#41; as audio_file:)

[//]: # (                transcript = await self.client.audio.transcriptions.create&#40;)

[//]: # (                    model="whisper-1",)

[//]: # (                    file=audio_file,)

[//]: # (                    language=language,)

[//]: # (                    response_format="verbose_json",)

[//]: # (                    timestamp_granularities=["word", "segment"])

[//]: # (                &#41;)

[//]: # (            return {)

[//]: # (                "text": transcript.text,)

[//]: # (                "segments": transcript.segments,)

[//]: # (                "words": transcript.words)

[//]: # (            })

[//]: # (        finally:)

[//]: # (            import os)

[//]: # (            os.unlink&#40;temp_path&#41;)

[//]: # (```)

[//]: # ()

[//]: # (## Text-to-Speech &#40;TTS&#41;)

[//]: # ()

[//]: # (### Browser Web Speech API &#40;Frontend&#41;)

[//]: # ()

[//]: # (```typescript)

[//]: # (export function useTextToSpeech&#40;&#41; {)

[//]: # (  const [isSpeaking, setIsSpeaking] = useState&#40;false&#41;;)

[//]: # (  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>&#40;[]&#41;;)

[//]: # (  const utteranceRef = useRef<SpeechSynthesisUtterance | null>&#40;null&#41;;)

[//]: # ()

[//]: # (  useEffect&#40;&#40;&#41; => {)

[//]: # (    const loadVoices = &#40;&#41; => {)

[//]: # (      const availableVoices = window.speechSynthesis.getVoices&#40;&#41;;)

[//]: # (      setVoices&#40;availableVoices&#41;;)

[//]: # (    };)

[//]: # ()

[//]: # (    loadVoices&#40;&#41;;)

[//]: # (    window.speechSynthesis.onvoiceschanged = loadVoices;)

[//]: # (  }, []&#41;;)

[//]: # ()

[//]: # (  const speak = useCallback&#40;&#40;)

[//]: # (    text: string,)

[//]: # (    options?: {)

[//]: # (      voice?: SpeechSynthesisVoice;)

[//]: # (      rate?: number;)

[//]: # (      pitch?: number;)

[//]: # (      volume?: number;)

[//]: # (    })

[//]: # (  &#41; => {)

[//]: # (    // Cancel any ongoing speech)

[//]: # (    window.speechSynthesis.cancel&#40;&#41;;)

[//]: # ()

[//]: # (    const utterance = new SpeechSynthesisUtterance&#40;text&#41;;)

[//]: # (    utterance.voice = options?.voice || voices[0];)

[//]: # (    utterance.rate = options?.rate || 1;)

[//]: # (    utterance.pitch = options?.pitch || 1;)

[//]: # (    utterance.volume = options?.volume || 1;)

[//]: # ()

[//]: # (    utterance.onstart = &#40;&#41; => setIsSpeaking&#40;true&#41;;)

[//]: # (    utterance.onend = &#40;&#41; => setIsSpeaking&#40;false&#41;;)

[//]: # (    utterance.onerror = &#40;&#41; => setIsSpeaking&#40;false&#41;;)

[//]: # ()

[//]: # (    utteranceRef.current = utterance;)

[//]: # (    window.speechSynthesis.speak&#40;utterance&#41;;)

[//]: # (  }, [voices]&#41;;)

[//]: # ()

[//]: # (  const stop = useCallback&#40;&#40;&#41; => {)

[//]: # (    window.speechSynthesis.cancel&#40;&#41;;)

[//]: # (    setIsSpeaking&#40;false&#41;;)

[//]: # (  }, []&#41;;)

[//]: # ()

[//]: # (  const pause = useCallback&#40;&#40;&#41; => {)

[//]: # (    window.speechSynthesis.pause&#40;&#41;;)

[//]: # (  }, []&#41;;)

[//]: # ()

[//]: # (  const resume = useCallback&#40;&#40;&#41; => {)

[//]: # (    window.speechSynthesis.resume&#40;&#41;;)

[//]: # (  }, []&#41;;)

[//]: # ()

[//]: # (  return {)

[//]: # (    isSpeaking,)

[//]: # (    voices,)

[//]: # (    speak,)

[//]: # (    stop,)

[//]: # (    pause,)

[//]: # (    resume,)

[//]: # (    isSupported: 'speechSynthesis' in window)

[//]: # (  };)

[//]: # (})

[//]: # (```)

[//]: # ()

[//]: # (### ElevenLabs API &#40;Backend&#41;)

[//]: # ()

[//]: # (```python)

[//]: # (import httpx)

[//]: # (from typing import AsyncGenerator)

[//]: # ()

[//]: # (class ElevenLabsService:)

[//]: # (    BASE_URL = "https://api.elevenlabs.io/v1")

[//]: # ()

[//]: # (    def __init__&#40;self, api_key: str&#41;:)

[//]: # (        self.api_key = api_key)

[//]: # (        self.default_voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel)

[//]: # ()

[//]: # (    async def text_to_speech&#40;)

[//]: # (        self,)

[//]: # (        text: str,)

[//]: # (        voice_id: str | None = None)

[//]: # (    &#41; -> bytes:)

[//]: # (        voice_id = voice_id or self.default_voice_id)

[//]: # ()

[//]: # (        async with httpx.AsyncClient&#40;&#41; as client:)

[//]: # (            response = await client.post&#40;)

[//]: # (                f"{self.BASE_URL}/text-to-speech/{voice_id}",)

[//]: # (                headers={)

[//]: # (                    "xi-api-key": self.api_key,)

[//]: # (                    "Content-Type": "application/json")

[//]: # (                },)

[//]: # (                json={)

[//]: # (                    "text": text,)

[//]: # (                    "model_id": "eleven_monolingual_v1",)

[//]: # (                    "voice_settings": {)

[//]: # (                        "stability": 0.5,)

[//]: # (                        "similarity_boost": 0.75)

[//]: # (                    })

[//]: # (                })

[//]: # (            &#41;)

[//]: # (            response.raise_for_status&#40;&#41;)

[//]: # (            return response.content)

[//]: # ()

[//]: # (    async def stream_text_to_speech&#40;)

[//]: # (        self,)

[//]: # (        text: str,)

[//]: # (        voice_id: str | None = None)

[//]: # (    &#41; -> AsyncGenerator[bytes, None]:)

[//]: # (        voice_id = voice_id or self.default_voice_id)

[//]: # ()

[//]: # (        async with httpx.AsyncClient&#40;&#41; as client:)

[//]: # (            async with client.stream&#40;)

[//]: # (                "POST",)

[//]: # (                f"{self.BASE_URL}/text-to-speech/{voice_id}/stream",)

[//]: # (                headers={)

[//]: # (                    "xi-api-key": self.api_key,)

[//]: # (                    "Content-Type": "application/json")

[//]: # (                },)

[//]: # (                json={)

[//]: # (                    "text": text,)

[//]: # (                    "model_id": "eleven_monolingual_v1",)

[//]: # (                    "voice_settings": {)

[//]: # (                        "stability": 0.5,)

[//]: # (                        "similarity_boost": 0.75)

[//]: # (                    })

[//]: # (                })

[//]: # (            &#41; as response:)

[//]: # (                async for chunk in response.aiter_bytes&#40;&#41;:)

[//]: # (                    yield chunk)

[//]: # ()

[//]: # (    async def get_voices&#40;self&#41; -> list[dict]:)

[//]: # (        async with httpx.AsyncClient&#40;&#41; as client:)

[//]: # (            response = await client.get&#40;)

[//]: # (                f"{self.BASE_URL}/voices",)

[//]: # (                headers={"xi-api-key": self.api_key})

[//]: # (            &#41;)

[//]: # (            response.raise_for_status&#40;&#41;)

[//]: # (            return response.json&#40;&#41;["voices"])

[//]: # (```)

[//]: # ()

[//]: # (### OpenAI TTS API &#40;Backend&#41;)

[//]: # ()

[//]: # (```python)

[//]: # (from openai import AsyncOpenAI)

[//]: # ()

[//]: # (class OpenAITTSService:)

[//]: # (    def __init__&#40;self, api_key: str&#41;:)

[//]: # (        self.client = AsyncOpenAI&#40;api_key=api_key&#41;)

[//]: # ()

[//]: # (    async def text_to_speech&#40;)

[//]: # (        self,)

[//]: # (        text: str,)

[//]: # (        voice: str = "alloy",)

[//]: # (        model: str = "tts-1")

[//]: # (    &#41; -> bytes:)

[//]: # (        response = await self.client.audio.speech.create&#40;)

[//]: # (            model=model,)

[//]: # (            voice=voice,)

[//]: # (            input=text)

[//]: # (        &#41;)

[//]: # (        return response.content)

[//]: # ()

[//]: # (    async def stream_text_to_speech&#40;)

[//]: # (        self,)

[//]: # (        text: str,)

[//]: # (        voice: str = "alloy",)

[//]: # (        model: str = "tts-1")

[//]: # (    &#41; -> AsyncGenerator[bytes, None]:)

[//]: # (        async with self.client.audio.speech.with_streaming_response.create&#40;)

[//]: # (            model=model,)

[//]: # (            voice=voice,)

[//]: # (            input=text)

[//]: # (        &#41; as response:)

[//]: # (            async for chunk in response.iter_bytes&#40;&#41;:)

[//]: # (                yield chunk)

[//]: # (```)

[//]: # ()

[//]: # (## Audio Streaming &#40;WebSocket&#41;)

[//]: # ()

[//]: # (### Backend WebSocket Handler)

[//]: # ()

[//]: # (```python)

[//]: # (from fastapi import WebSocket)

[//]: # (import asyncio)

[//]: # ()

[//]: # (@app.websocket&#40;"/ws/audio/{user_id}"&#41;)

[//]: # (async def audio_websocket&#40;websocket: WebSocket, user_id: str&#41;:)

[//]: # (    await websocket.accept&#40;&#41;)

[//]: # ()

[//]: # (    try:)

[//]: # (        while True:)

[//]: # (            # Receive audio chunk)

[//]: # (            audio_chunk = await websocket.receive_bytes&#40;&#41;)

[//]: # ()

[//]: # (            # Process STT)

[//]: # (            transcript = await whisper_service.transcribe&#40;audio_chunk&#41;)

[//]: # ()

[//]: # (            if transcript:)

[//]: # (                # Send transcript back)

[//]: # (                await websocket.send_json&#40;{)

[//]: # (                    "type": "transcript",)

[//]: # (                    "text": transcript)

[//]: # (                }&#41;)

[//]: # ()

[//]: # (                # Generate AI response)

[//]: # (                response = await ai_service.generate_response&#40;transcript&#41;)

[//]: # ()

[//]: # (                # Stream TTS response)

[//]: # (                async for audio_chunk in tts_service.stream_text_to_speech&#40;response&#41;:)

[//]: # (                    await websocket.send_bytes&#40;audio_chunk&#41;)

[//]: # ()

[//]: # (                await websocket.send_json&#40;{"type": "audio_complete"}&#41;)

[//]: # ()

[//]: # (    except Exception as e:)

[//]: # (        await websocket.close&#40;code=1000&#41;)

[//]: # (```)

[//]: # ()

[//]: # (### Frontend Audio Streaming)

[//]: # ()

[//]: # (```typescript)

[//]: # (export function useAudioStream&#40;wsUrl: string&#41; {)

[//]: # (  const wsRef = useRef<WebSocket | null>&#40;null&#41;;)

[//]: # (  const audioContextRef = useRef<AudioContext | null>&#40;null&#41;;)

[//]: # (  const [isConnected, setIsConnected] = useState&#40;false&#41;;)

[//]: # ()

[//]: # (  const connect = useCallback&#40;&#40;&#41; => {)

[//]: # (    const ws = new WebSocket&#40;wsUrl&#41;;)

[//]: # (    ws.binaryType = 'arraybuffer';)

[//]: # ()

[//]: # (    ws.onopen = &#40;&#41; => {)

[//]: # (      setIsConnected&#40;true&#41;;)

[//]: # (      audioContextRef.current = new AudioContext&#40;&#41;;)

[//]: # (    };)

[//]: # ()

[//]: # (    ws.onmessage = async &#40;event&#41; => {)

[//]: # (      if &#40;event.data instanceof ArrayBuffer&#41; {)

[//]: # (        // Play received audio)

[//]: # (        const audioContext = audioContextRef.current;)

[//]: # (        if &#40;audioContext&#41; {)

[//]: # (          const audioBuffer = await audioContext.decodeAudioData&#40;event.data&#41;;)

[//]: # (          const source = audioContext.createBufferSource&#40;&#41;;)

[//]: # (          source.buffer = audioBuffer;)

[//]: # (          source.connect&#40;audioContext.destination&#41;;)

[//]: # (          source.start&#40;&#41;;)

[//]: # (        })

[//]: # (      } else {)

[//]: # (        // Handle JSON messages)

[//]: # (        const data = JSON.parse&#40;event.data&#41;;)

[//]: # (        console.log&#40;'Received:', data&#41;;)

[//]: # (      })

[//]: # (    };)

[//]: # ()

[//]: # (    wsRef.current = ws;)

[//]: # (  }, [wsUrl]&#41;;)

[//]: # ()

[//]: # (  const sendAudio = useCallback&#40;&#40;audioData: ArrayBuffer&#41; => {)

[//]: # (    if &#40;wsRef.current?.readyState === WebSocket.OPEN&#41; {)

[//]: # (      wsRef.current.send&#40;audioData&#41;;)

[//]: # (    })

[//]: # (  }, []&#41;;)

[//]: # ()

[//]: # (  return { isConnected, connect, sendAudio };)

[//]: # (})

[//]: # (```)

[//]: # ()

[//]: # (## Best Practices)

[//]: # ()

[//]: # (1. **Always stream responses** for better UX)

[//]: # (2. **Implement retry logic** for API failures)

[//]: # (3. **Cache common TTS phrases** to reduce API calls)

[//]: # (4. **Use WebSocket** for real-time audio)

[//]: # (5. **Validate audio files** before processing)

[//]: # (6. **Handle rate limits** gracefully)

[//]: # (7. **Log API usage** for monitoring costs)
