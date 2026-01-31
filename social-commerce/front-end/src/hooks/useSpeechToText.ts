import {useState, useRef, useCallback, useEffect} from "react";

interface SpeechRecognitionEvent extends Event {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;

    item(index: number): SpeechRecognitionResult;

    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;

    item(index: number): SpeechRecognitionAlternative;

    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onspeechend: (() => void) | null;

    start(): void;

    stop(): void;

    abort(): void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

declare global {
    interface Window {
        webkitSpeechRecognition: SpeechRecognitionConstructor;
        SpeechRecognition: SpeechRecognitionConstructor;
    }
}

const VIETNAMESE_LANG = "vi-VN";

interface STTOptions {
    lang?: string;
    continuous?: boolean;
    interimResults?: boolean;
}

export function useSpeechToText(options: STTOptions = {}) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState("");
    const [error, setError] = useState<string | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);

    const {
        lang = VIETNAMESE_LANG,
        continuous = true,
        interimResults = true,
    } = options;

    useEffect(() => {
        const SpeechRecognitionAPI =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionAPI) return;

        const recognition = new SpeechRecognitionAPI();

        // Vietnamese language settings
        recognition.lang = lang;
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;

        // Increase max alternatives for better Vietnamese recognition
        recognition.maxAlternatives = 3;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let interim = "";
            let final = "";

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                // Get the most confident result
                const transcriptText = result[0].transcript;

                if (result.isFinal) {
                    final += transcriptText;
                } else {
                    interim += transcriptText;
                }
            }

            if (final) {
                setTranscript((prev) => prev + final);
            }
            setInterimTranscript(interim);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            const errorMessages: Record<string, string> = {
                "no-speech": "Không nghe thấy giọng nói",
                "audio-capture": "Không thể truy cập microphone",
                "not-allowed": "Quyền truy cập microphone bị từ chối",
                network: "Lỗi kết nối mạng",
                aborted: "Đã hủy nhận dạng giọng nói",
                "language-not-supported": "Ngôn ngữ không được hỗ trợ",
            };

            setError(errorMessages[event.error] ?? `Lỗi: ${event.error}`);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onspeechend = () => {
            // Vietnamese speech often has natural pauses
            // Don't stop immediately on speech end if continuous mode
            if (!continuous) {
                recognition.stop();
            }
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
        };
    }, [lang, continuous, interimResults]);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            setError("Trình duyệt không hỗ trợ nhận dạng giọng nói");
            return;
        }

        setError(null);
        setTranscript("");
        setInterimTranscript("");

        try {
            recognitionRef.current.start();
            setIsListening(true);
        } catch (err) {
            // Recognition might already be running
            if (err instanceof Error && err.name === "InvalidStateError") {
                recognitionRef.current.stop();
                setTimeout(() => {
                    recognitionRef.current?.start();
                    setIsListening(true);
                }, 100);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        recognitionRef.current?.stop();
        setIsListening(false);
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript("");
        setInterimTranscript("");
    }, []);

    const isSupported =
        typeof window !== "undefined" &&
        ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

    return {
        isListening,
        transcript,
        interimTranscript,
        error,
        startListening,
        stopListening,
        resetTranscript,
        isSupported,
    };
}
