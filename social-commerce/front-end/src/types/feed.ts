export type Mood = "happy" | "excited" | "curious" | "sleepy" | "surprised" | "love";

export interface FeedItem {
    id: string;
    title: string;
    mood: Mood;
    background_color: string;
    greeting: string;
    creator: string;
}

export interface FeedResponse {
    success: boolean;
    data: FeedItem[];
}
