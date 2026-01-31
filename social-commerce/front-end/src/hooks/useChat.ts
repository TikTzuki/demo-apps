import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {api} from '@/lib/api';
import type {Conversation, Message, SendMessageRequest} from '@/types/chat';

export function useConversations() {
    return useQuery({
        queryKey: ['conversations'],
        queryFn: () => api.get<Conversation[]>('/api/v1/chat/conversations'),
    });
}

export function useMessages(conversationId: string | null) {
    return useQuery({
        queryKey: ['messages', conversationId],
        queryFn: () =>
            api.get<Message[]>(`/api/v1/chat/conversations/${conversationId}/messages`),
        enabled: !!conversationId,
    });
}

export function useSendMessage() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: SendMessageRequest) =>
            api.post<Message>('/api/v1/chat/messages', data),
        onSuccess: (_, variables) => {
            if (variables.conversationId) {
                queryClient.invalidateQueries({
                    queryKey: ['messages', variables.conversationId],
                });
            }
            queryClient.invalidateQueries({queryKey: ['conversations']});
        },
    });
}

export function useCreateConversation() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (title: string) =>
            api.post<Conversation>('/api/v1/chat/conversations', {title}),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['conversations']});
        },
    });
}
