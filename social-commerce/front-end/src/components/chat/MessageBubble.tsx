import {cn} from '@/lib/utils';
import type {Message} from '@/types/chat';

interface MessageBubbleProps {
    message: Message;
}

export function MessageBubble({message}: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div className={cn('flex mb-4', isUser ? 'justify-end' : 'justify-start')}>
            <div
                className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
                )}
            >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <time className="text-xs opacity-70 mt-1 block">
                    {new Date(message.createdAt).toLocaleTimeString()}
                </time>
            </div>
        </div>
    );
}
