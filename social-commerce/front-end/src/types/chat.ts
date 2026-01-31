export interface User {
    id: string;
    email: string;
    name: string;
    createdAt: string;
}

export interface Conversation {
    id: string;
    title: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}

export interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    conversationId: string;
    createdAt: string;
}

export interface SendMessageRequest {
    content: string;
    conversationId?: string;
}

export interface StreamingMessage {
    type: 'chunk' | 'done' | 'error';
    content?: string;
    error?: string;
}
