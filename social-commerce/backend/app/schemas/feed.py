from typing import Literal

from pydantic import BaseModel, Field

Mood = Literal["happy", "excited", "curious", "surprised"]


class FeedItem(BaseModel):
    id: str = Field(..., description="Unique identifier for the feed item")
    title: str = Field(..., min_length=1, max_length=200)
    mood: Mood = Field(default="happy", description="CuteFace mood variant")
    background_color: str = Field(
        default="#f6c400",
        pattern=r"^#[0-9a-fA-F]{6}$",
        description="Background color hex code"
    )
    greeting: str = Field(..., min_length=1, max_length=500)
    creator: str = Field(..., pattern=r"^@[\w]+$", description="Creator username with @ prefix")


class FeedResponse(BaseModel):
    success: bool
    data: list[FeedItem]
