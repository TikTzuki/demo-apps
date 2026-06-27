from sqlalchemy import create_engine, event, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

from app.config import settings

_is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# SQLite needs check_same_thread=False because FastAPI serves requests across
# threads; Postgres ignores the arg.
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)

if _is_sqlite:
    # SQLite disables foreign-key enforcement (and thus ON DELETE CASCADE)
    # unless turned on for every connection.
    @event.listens_for(engine, "connect")
    def _enable_sqlite_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Columns added after the initial schema. Each entry: (table, column, ddl-type).
# Applied idempotently on startup by checking the live schema first, so this
# works on both Postgres (existing deployments) and SQLite (desktop build) —
# SQLite has no `ADD COLUMN IF NOT EXISTS`.
_INLINE_COLUMN_ADDITIONS = [
    ("departments", "sheet_id", "VARCHAR(100)"),
    ("departments", "last_synced_at", "TIMESTAMP"),
    ("cvs", "status_updated_at", "TIMESTAMP"),
    ("cvs", "last_synced_at", "TIMESTAMP"),
]


def apply_inline_migrations() -> None:
    """Add new columns to existing tables if they are missing."""
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    pending = []
    for table, column, ddl_type in _INLINE_COLUMN_ADDITIONS:
        if table not in existing_tables:
            continue
        columns = {col["name"] for col in inspector.get_columns(table)}
        if column not in columns:
            pending.append((table, column, ddl_type))

    if not pending:
        return

    with engine.begin() as conn:
        for table, column, ddl_type in pending:
            conn.execute(
                text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl_type}")
            )
