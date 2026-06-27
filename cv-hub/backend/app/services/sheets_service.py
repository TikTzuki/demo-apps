import logging
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.config import settings
from app.models import CV, CVJDMatch, Department

logger = logging.getLogger(__name__)

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SHEET_TAB_NAME = "CVs"
HEADERS = [
    "CV ID",
    "Original Filename",
    "Status",
    "Uploaded At",
    "Review Score",
    "Best Match %",
    "PDF Link",
    "App Status Updated At",
]
HEADER_RANGE = f"{SHEET_TAB_NAME}!A1:H1"
DATA_RANGE = f"{SHEET_TAB_NAME}!A2:H"
STATUS_COL_INDEX = 2  # zero-based, column C
ID_COL_INDEX = 0
APP_TS_COL_INDEX = 7
VALID_STATUSES = {"pending", "passed", "failed"}


_SHEET_URL_RE = re.compile(r"/spreadsheets/d/([A-Za-z0-9_-]+)")


def extract_sheet_id(value: str) -> str:
    """Accept either a Sheets URL or a raw sheet ID, return the ID."""
    if not value:
        raise ValueError("Sheet ID or URL is required.")
    value = value.strip()
    m = _SHEET_URL_RE.search(value)
    if m:
        return m.group(1)
    if "/" in value or " " in value:
        raise ValueError("Could not parse Google Sheets ID from value.")
    return value


def _get_service():
    creds_path = settings.GOOGLE_SERVICE_ACCOUNT_JSON
    if not Path(creds_path).exists():
        raise RuntimeError(
            f"Google service account credentials not found at {creds_path}. "
            "Set GOOGLE_SERVICE_ACCOUNT_JSON to the path of the JSON key file."
        )
    credentials = service_account.Credentials.from_service_account_file(
        creds_path, scopes=SCOPES
    )
    return build("sheets", "v4", credentials=credentials, cache_discovery=False)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _format_ts(ts: datetime | None) -> str:
    if ts is None:
        return ""
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)
    return ts.astimezone(timezone.utc).isoformat()


def _parse_ts(value: str) -> datetime | None:
    if not value:
        return None
    try:
        ts = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return ts
    except ValueError:
        return None


def _pdf_link(cv_id: int) -> str:
    base = settings.PUBLIC_BASE_URL.rstrip("/") if settings.PUBLIC_BASE_URL else ""
    return f"{base}/api/cvs/{cv_id}/file" if base else f"/api/cvs/{cv_id}/file"


def _build_row(cv: CV, db: Session) -> list[Any]:
    review_score = cv.review.overall_score if cv.review else ""
    best_match = (
        db.query(func.max(CVJDMatch.match_percentage))
        .filter(CVJDMatch.cv_id == cv.id)
        .scalar()
    )
    return [
        cv.id,
        cv.original_filename,
        cv.status,
        _format_ts(cv.uploaded_at),
        review_score if review_score != "" else "",
        best_match if best_match is not None else "",
        _pdf_link(cv.id),
        _format_ts(cv.status_updated_at),
    ]


def _ensure_tab_and_header(service, spreadsheet_id: str) -> None:
    """Create the CVs tab if missing and write the header row."""
    try:
        meta = service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
    except HttpError as e:
        raise RuntimeError(f"Cannot open spreadsheet: {e}") from e

    tab_names = [s["properties"]["title"] for s in meta.get("sheets", [])]
    if SHEET_TAB_NAME not in tab_names:
        service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={
                "requests": [
                    {"addSheet": {"properties": {"title": SHEET_TAB_NAME}}}
                ]
            },
        ).execute()

    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=HEADER_RANGE,
        valueInputOption="RAW",
        body={"values": [HEADERS]},
    ).execute()


def _read_rows(service, spreadsheet_id: str) -> list[list[str]]:
    resp = (
        service.spreadsheets()
        .values()
        .get(spreadsheetId=spreadsheet_id, range=DATA_RANGE)
        .execute()
    )
    return resp.get("values", [])


def _pull_status_changes(
    rows: list[list[str]], db: Session, department_id: int
) -> dict[str, Any]:
    """Apply sheet→app status changes using last-write-wins."""
    applied = 0
    skipped_conflicts = 0
    invalid = 0

    by_id: dict[int, list[str]] = {}
    for row in rows:
        if not row:
            continue
        raw_id = row[ID_COL_INDEX] if len(row) > ID_COL_INDEX else ""
        try:
            cv_id = int(raw_id)
        except (TypeError, ValueError):
            continue
        by_id[cv_id] = row

    if not by_id:
        return {"applied": 0, "skipped_conflicts": 0, "invalid": 0}

    cvs = (
        db.query(CV)
        .filter(CV.department_id == department_id, CV.id.in_(by_id.keys()))
        .all()
    )

    for cv in cvs:
        row = by_id.get(cv.id)
        if not row:
            continue
        sheet_status = (
            row[STATUS_COL_INDEX].strip().lower()
            if len(row) > STATUS_COL_INDEX
            else ""
        )
        if not sheet_status or sheet_status == cv.status:
            continue
        if sheet_status not in VALID_STATUSES:
            invalid += 1
            continue

        sheet_app_ts_raw = (
            row[APP_TS_COL_INDEX] if len(row) > APP_TS_COL_INDEX else ""
        )
        sheet_app_ts = _parse_ts(sheet_app_ts_raw)
        app_status_ts = cv.status_updated_at
        if app_status_ts is not None and app_status_ts.tzinfo is None:
            app_status_ts = app_status_ts.replace(tzinfo=timezone.utc)

        # Sheet wins only when its mirrored app-timestamp matches what we last
        # wrote (i.e. the human edited the sheet against the current snapshot).
        # Any drift means the app moved on after the sheet was last synced.
        sheet_in_sync = (
            sheet_app_ts is not None
            and app_status_ts is not None
            and abs((sheet_app_ts - app_status_ts).total_seconds()) < 1
        ) or (sheet_app_ts is None and app_status_ts is None)

        if sheet_in_sync:
            cv.status = sheet_status
            cv.status_updated_at = _now()
            applied += 1
        else:
            skipped_conflicts += 1

    db.flush()
    return {
        "applied": applied,
        "skipped_conflicts": skipped_conflicts,
        "invalid": invalid,
    }


def _push_all_rows(
    service, spreadsheet_id: str, db: Session, department_id: int
) -> int:
    cvs = (
        db.query(CV)
        .filter(CV.department_id == department_id)
        .order_by(CV.uploaded_at.desc())
        .all()
    )
    rows = [_build_row(cv, db) for cv in cvs]
    now = _now()
    for cv in cvs:
        cv.last_synced_at = now

    # Clear existing data area before writing.
    service.spreadsheets().values().clear(
        spreadsheetId=spreadsheet_id, range=DATA_RANGE, body={}
    ).execute()
    if rows:
        service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=f"{SHEET_TAB_NAME}!A2",
            valueInputOption="RAW",
            body={"values": rows},
        ).execute()
    return len(rows)


def sync_department(department: Department, db: Session) -> dict[str, Any]:
    """Pull status changes from Sheets then push current state back."""
    if not department.sheet_id:
        raise ValueError("Department has no Google Sheet configured.")

    service = _get_service()
    spreadsheet_id = department.sheet_id

    _ensure_tab_and_header(service, spreadsheet_id)
    rows = _read_rows(service, spreadsheet_id)
    pull_stats = _pull_status_changes(rows, db, department.id)
    pushed = _push_all_rows(service, spreadsheet_id, db, department.id)

    department.last_synced_at = _now()
    db.commit()

    return {
        "department_id": department.id,
        "rows_pushed": pushed,
        "status_updates_applied": pull_stats["applied"],
        "conflicts_skipped": pull_stats["skipped_conflicts"],
        "invalid_status_values": pull_stats["invalid"],
        "synced_at": _format_ts(department.last_synced_at),
    }
