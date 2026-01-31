import {useState, useCallback, useEffect, useRef} from "react";

const VIETNAMESE_LANG = "vi-VN";

type VoicePreset = "friendly" | "excited" | "calm" | "sleepy" | "surprised" | "love";
type TTSProvider = "google" | "browser" | "auto";

interface TTSOptions {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
    preset?: VoicePreset;
    provider?: TTSProvider;
}

function findVietnameseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    const preferredVoices = [
        "Google tiếng Việt",
        "Microsoft An Online",
        "Microsoft NamMinh Online",
        "Linh",
        "vi-VN",
        "Vietnamese",
    ];

    for (const preferred of preferredVoices) {
        const voice = voices.find(
            (v) =>
                v.name.includes(preferred) ||
                v.lang === preferred ||
                v.lang.startsWith("vi")
        );
        if (voice) return voice;
    }

    return voices.find((v) => v.lang.startsWith("vi")) ?? null;
}

// Map mood to Google TTS preset
const MOOD_TO_PRESET: Record<string, VoicePreset> = {
    happy: "friendly",
    excited: "excited",
    curious: "friendly",
    sleepy: "sleepy",
    surprised: "surprised",
    love: "love",
};

export function useTextToSpeech() {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [provider, setProvider] = useState<TTSProvider>("auto");

    const vietnameseVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Load browser voices
    useEffect(() => {
        if (!("speechSynthesis" in window)) return;

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
            vietnameseVoiceRef.current = findVietnameseVoice(availableVoices);
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;

        return () => {
            window.speechSynthesis.onvoiceschanged = null;
        };
    }, []);

    // Google Cloud TTS
    const speakWithGoogle = useCallback(async (text: string, options: TTSOptions) => {
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
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        text,
                        preset: options.preset,
                        speaking_rate: options.rate,
                        pitch: options.pitch,
                    }),
                    signal: abortControllerRef.current.signal,
                }
            );

            if (!response.ok) {
                throw new Error("Google TTS không khả dụng");
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
                URL.revokeObjectURL(audioUrl);
                audioRef.current = null;
            };

            await audio.play();
            return true;
        } catch (err) {
            setIsLoading(false);
            if (err instanceof Error && err.name === "AbortError") {
                return true;
            }
            return false;
        }
    }, []);

    // Browser TTS fallback
    const speakWithBrowser = useCallback((text: string, options: TTSOptions) => {
        if (!("speechSynthesis" in window)) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.lang ?? VIETNAMESE_LANG;

        if (vietnameseVoiceRef.current && !options.lang) {
            utterance.voice = vietnameseVoiceRef.current;
        }

        utterance.rate = options.rate ?? 0.9;
        utterance.pitch = options.pitch ?? 1.0;
        utterance.volume = options.volume ?? 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    }, []);

    // Main speak function with auto fallback
    const speak = useCallback(
        async (text: string, options: TTSOptions = {}) => {
            const selectedProvider = options.provider ?? provider;

            // Try Google TTS first if auto or google
            if (selectedProvider === "auto" || selectedProvider === "google") {
                const success = await speakWithGoogle(text, options);
                if (success) return;

                // Fallback to browser if Google fails
                if (selectedProvider === "auto") {
                    speakWithBrowser(text, options);
                    return;
                }
            }

            // Use browser TTS
            if (selectedProvider === "browser") {
                speakWithBrowser(text, options);
            }
        },
        [provider, speakWithGoogle, speakWithBrowser]
    );

    // Convenience method for mood-based speaking
    const speakWithMood = useCallback(
        async (text: string, mood: string, options: TTSOptions = {}) => {
            const preset = MOOD_TO_PRESET[mood] ?? "friendly";
            await speak(text, {...options, preset});
        },
        [speak]
    );

    const stop = useCallback(() => {
        // Stop Google TTS
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        // Stop browser TTS
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
        }

        setIsSpeaking(false);
        setIsLoading(false);
    }, []);

    return {
        speak,
        speakWithMood,
        stop,
        isSpeaking,
        isLoading,
        error,
        voices,
        provider,
        setProvider,
        vietnameseVoice: vietnameseVoiceRef.current,
        isSupported: "speechSynthesis" in window,
    };
}
