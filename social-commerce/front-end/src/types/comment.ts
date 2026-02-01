export interface Comment {
    id: string;
    feed_id: string;
    content: string;
    creator: string;
    created_at: string;
}

export interface CommentCreate {
    feed_id: string;
    content: string;
    creator: string;
}

export interface CommentResponse {
    success: boolean;
    data?: Comment;
    message?: string;
}

export interface CommentsListResponse {
    success: boolean;
    data: Comment[];
}
