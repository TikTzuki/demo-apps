import {motion, AnimatePresence} from "motion/react";

import type {Comment} from "@/types/comment";

interface CommentsListProps {
    comments: Comment[];
    isLoading?: boolean;
}

function formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return date.toLocaleDateString("vi-VN");
}

export default function CommentsList({comments, isLoading}: CommentsListProps) {
    if (isLoading) {
        return (
            <div className="flex justify-center py-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            </div>
        );
    }

    if (comments.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2 max-h-32 overflow-y-auto scrollbar-hide">
            <AnimatePresence mode="popLayout">
                {comments.slice(0, 5).map((comment) => (
                    <motion.div
                        key={comment.id}
                        initial={{opacity: 0, x: -20}}
                        animate={{opacity: 1, x: 0}}
                        exit={{opacity: 0, x: 20}}
                        layout
                        className="flex items-start gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2"
                    >
                        <div
                            className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">
                {comment.creator.charAt(1).toUpperCase()}
              </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                <span className="text-white/80 text-xs font-medium">
                  {comment.creator}
                </span>
                                <span className="text-white/50 text-xs">
                  {formatTime(comment.created_at)}
                </span>
                            </div>
                            <p className="text-white text-sm break-words">{comment.content}</p>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>

            {comments.length > 5 && (
                <p className="text-white/60 text-xs text-center">
                    +{comments.length - 5} bình luận khác
                </p>
            )}
        </div>
    );
}
