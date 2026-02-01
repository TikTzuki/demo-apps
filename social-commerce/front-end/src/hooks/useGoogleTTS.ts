import {useState, useCallback, useRef} from "react";

type VoicePreset = "friendly" | "excited" | "calm" | "sleepy" | "surprised" | "love";

interface TTSOptions {
    preset?: VoicePreset;
    speakingRate?: number;
    pitch?: number;
}

export function useGoogleTTS() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
        // Stop any current playback
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setError(null);
        setIsLoading(true);

        try {
            abortControllerRef.current = new AbortController();

            const response = await fetch(
                `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/v1/tts/synthesize`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        text,
                        preset: options.preset,
                        speaking_rate: options.speakingRate,
                        pitch: options.pitch,
                    }),
                    signal: abortControllerRef.current.signal,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || "Failed to synthesize speech");
            }

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);

            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onplay = () => {
                setIsLoading(false);
                setIsSpeaking(true);
            };

            audio.onended = () => {
                setIsSpeaking(false);
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            audio.onerror = () => {
                setIsSpeaking(false);
                setIsLoading(false);
                setError("Không thể phát âm thanh");
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            await audio.play();
        } catch (err) {
            setIsLoading(false);
            setIsSpeaking(false);

            if (err instanceof Error) {
                if (err.name === "AbortError") {
                    return; // Request was cancelled, not an error
                }
                setError(err.message);
            } else {
                setError("Đã xảy ra lỗi không xác định");
            }
        }
    }, []);

    const stop = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        setIsSpeaking(false);
        setIsLoading(false);
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
        isLoading,
        error,
    };
}
