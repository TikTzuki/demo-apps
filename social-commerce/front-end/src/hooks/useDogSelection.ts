import {useState, useCallback, useRef} from "react";
import {
    type DogId,
    DEFAULT_DOG_ID,
    getNextDogId,
    DOG_CONFIGS,
} from "@/config/dogs";

const STORAGE_KEY = "selected-dog-id";
const DOUBLE_TAP_DELAY = 300; // ms

function getStoredDogId(): DogId {
    if (typeof window === "undefined") return DEFAULT_DOG_ID;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        const parsed = parseInt(stored, 10);
        if (parsed >= 1 && parsed <= 8) {
            return parsed as DogId;
        }
    }
    return DEFAULT_DOG_ID;
}

function storeDogId(dogId: DogId): void {
    localStorage.setItem(STORAGE_KEY, String(dogId));
}

export function useDogSelection() {
    const [dogId, setDogIdState] = useState<DogId>(getStoredDogId);
    const lastTapTimeRef = useRef<number>(0);

    const setDogId = useCallback((id: DogId) => {
        setDogIdState(id);
        storeDogId(id);
    }, []);

    const switchToNextDog = useCallback(() => {
        setDogIdState((current) => {
            const next = getNextDogId(current);
            storeDogId(next);
            return next;
        });
    }, []);

    const handleDoubleTap = useCallback(() => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTimeRef.current;

        if (timeSinceLastTap < DOUBLE_TAP_DELAY) {
            switchToNextDog();
            lastTapTimeRef.current = 0; // Reset to prevent triple-tap
            return true;
        }

        lastTapTimeRef.current = now;
        return false;
    }, [switchToNextDog]);

    const dogConfig = DOG_CONFIGS[dogId];

    return {
        dogId,
        dogConfig,
        setDogId,
        switchToNextDog,
        handleDoubleTap,
    };
}
