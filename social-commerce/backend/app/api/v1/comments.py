import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException

from app.schemas.comment import (
    Comment,
    CommentCreate,
    CommentResponse,
    CommentsListResponse,
)

router = APIRouter()

# In-memory storage for comments (in production, use a database)
comments_store: dict[str, list[Comment]] = {}


@router.post("", response_model=CommentResponse)
async def create_comment(comment_data: CommentCreate) -> CommentResponse:
    """Create a new comment for a feed item."""
    comment = Comment(
        id=str(uuid.uuid4()),
        feed_id=comment_data.feed_id,
        content=comment_data.content,
        creator=comment_data.creator,
        created_at=datetime.now(),
    )

    if comment_data.feed_id not in comments_store:
        comments_store[comment_data.feed_id] = []

    comments_store[comment_data.feed_id].append(comment)

    return CommentResponse(
        success=True,
        data=comment,
        message="Bình luận đã được thêm thành công",
    )


@router.get("/{feed_id}", response_model=CommentsListResponse)
async def get_comments(feed_id: str) -> CommentsListResponse:
    """Get all comments for a feed item."""
    comments = comments_store.get(feed_id, [])
    # Return newest first
    sorted_comments = sorted(comments, key=lambda c: c.created_at, reverse=True)

    return CommentsListResponse(success=True, data=sorted_comments)


@router.delete("/{comment_id}")
async def delete_comment(comment_id: str) -> CommentResponse:
    """Delete a comment by ID."""
    for feed_id, comments in comments_store.items():
        for i, comment in enumerate(comments):
            if comment.id == comment_id:
                deleted = comments.pop(i)
                return CommentResponse(
                    success=True,
                    data=deleted,
                    message="Bình luận đã được xóa",
                )

    raise HTTPException(status_code=404, detail="Không tìm thấy bình luận")
