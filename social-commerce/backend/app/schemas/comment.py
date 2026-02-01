from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    feed_id: str = Field(..., description="ID of the feed item")
    content: str = Field(..., min_length=1, max_length=500)
    creator: str = Field(..., pattern=r"^@[\w]+$", description="Creator username with @ prefix")


class Comment(BaseModel):
    id: str
    feed_id: str
    content: str
    creator: str
    created_at: datetime


class CommentResponse(BaseModel):
    success: bool
    data: Optional[Comment] = None
    message: Optional[str] = None


class CommentsListResponse(BaseModel):
    success: bool
    data: list[Comment]
