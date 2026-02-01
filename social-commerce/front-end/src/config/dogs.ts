import type {Mood} from "@/types/feed";

export type DogId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface DogConfig {
    id: DogId;
    name: string;
    availableEmotions: readonly Mood[];
    fallbackEmotion: Mood;
}

// Mapping of which emotions each dog has
// Dogs 1-4 only have default, Dogs 5-8 have multiple emotions
export const DOG_CONFIGS: Record<DogId, DogConfig> = {
    1: {
        id: 1,
        name: "Golden",
        availableEmotions: ["happy"] as const,
        fallbackEmotion: "happy",
    },
    2: {
        id: 2,
        name: "Buddy",
        availableEmotions: ["happy"] as const,
        fallbackEmotion: "happy",
    },
    3: {
        id: 3,
        name: "Max",
        availableEmotions: ["happy"] as const,
        fallbackEmotion: "happy",
    },
    4: {
        id: 4,
        name: "Charlie",
        availableEmotions: ["happy"] as const,
        fallbackEmotion: "happy",
    },
    5: {
        id: 5,
        name: "Luna",
        availableEmotions: ["happy", "excited", "curious"] as const,
        fallbackEmotion: "happy",
    },
    6: {
        id: 6,
        name: "Bella",
        availableEmotions: ["happy", "excited", "curious"] as const,
        fallbackEmotion: "happy",
    },
    7: {
        id: 7,
        name: "Rocky",
        availableEmotions: ["happy", "excited", "curious"] as const,
        fallbackEmotion: "happy",
    },
    8: {
        id: 8,
        name: "Mochi",
        availableEmotions: ["happy", "excited", "curious", "surprised"] as const,
        fallbackEmotion: "happy",
    },
};

// Emotion to SVG filename mapping
const EMOTION_TO_FILE: Record<Mood, string> = {
    happy: "happy.svg",
    excited: "excited.svg",
    curious: "curious.svg",
    sleepy: "default.svg",
    surprised: "surprised.svg",
    love: "happy.svg",
};

// Dogs 1-4 only have default.svg
const DEFAULT_ONLY_DOGS: DogId[] = [1, 2, 3, 4];

export function getDogImagePath(dogId: DogId, mood: Mood): string {
    // Dogs 1-4 only have default.svg
    if (DEFAULT_ONLY_DOGS.includes(dogId)) {
        return `/dogs/dog-${dogId}/default.svg`;
    }

    const config = DOG_CONFIGS[dogId];

    // Check if this dog has the requested emotion
    if (config.availableEmotions.includes(mood)) {
        return `/dogs/dog-${dogId}/${EMOTION_TO_FILE[mood]}`;
    }

    // Fallback: use default.svg if emotion not available
    // Special case: dog-8 doesn't have default.svg, use happy.svg
    if (dogId === 8) {
        return `/dogs/dog-${dogId}/happy.svg`;
    }

    return `/dogs/dog-${dogId}/default.svg`;
}

export function getNextDogId(currentId: DogId): DogId {
    const nextId = currentId === 8 ? 1 : currentId + 1;
    return nextId as DogId;
}

export const DEFAULT_DOG_ID: DogId = 5;
export const TOTAL_DOGS = 8;
