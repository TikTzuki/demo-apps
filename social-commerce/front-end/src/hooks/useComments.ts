import {useQuery, useMutation, useQueryClient} from "@tanstack/react-query";

import {api} from "@/lib/api";
import type {
    CommentCreate,
    CommentResponse,
    CommentsListResponse,
} from "@/types/comment";

async function fetchComments(feedId: string): Promise<CommentsListResponse> {
    return api.get<CommentsListResponse>(`/api/v1/comments/${feedId}`);
}

async function createComment(data: CommentCreate): Promise<CommentResponse> {
    return api.post<CommentResponse>("/api/v1/comments", data);
}

export function useComments(feedId: string) {
    const queryClient = useQueryClient();

    const commentsQuery = useQuery({
        queryKey: ["comments", feedId],
        queryFn: () => fetchComments(feedId),
        enabled: !!feedId,
    });

    const addCommentMutation = useMutation({
        mutationFn: createComment,
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ["comments", feedId]});
        },
    });

    const addComment = async (content: string, creator: string) => {
        return addCommentMutation.mutateAsync({
            feed_id: feedId,
            content,
            creator,
        });
    };

    return {
        comments: commentsQuery.data?.data ?? [],
        isLoading: commentsQuery.isLoading,
        error: commentsQuery.error,
        addComment,
        isAddingComment: addCommentMutation.isPending,
    };
}
