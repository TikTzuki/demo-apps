from fastapi import Depends, HTTPException, Query, status
from fastapi.security import APIKeyHeader

from app.config import settings

_api_key_header = APIKeyHeader(name="X-Admin-Key", auto_error=False)


async def require_admin_key(
        api_key: str | None = Depends(_api_key_header),
        key: str | None = Query(None, include_in_schema=False),
):
    """Check admin key from header (X-Admin-Key) or query param (?key=)."""
    token = api_key or key
    if not token or token != settings.ADMIN_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing admin key.",
        )
