from fastapi import APIRouter

from app.api.v1 import feed, tts, comments, pose

router = APIRouter(prefix="/v1")
router.include_router(feed.router, prefix="/feed", tags=["feed"])
router.include_router(tts.router, prefix="/tts", tags=["tts"])
router.include_router(comments.router, prefix="/comments", tags=["comments"])
router.include_router(pose.router, prefix="/pose", tags=["pose"])
