from sqlalchemy import inspect, text

# Columns added after the first release. create_all() only creates missing *tables*,
# so older databases get these columns added here. The SQL types/defaults used
# (VARCHAR, BOOLEAN ... DEFAULT FALSE, TIMESTAMP) work on both SQLite and PostgreSQL.
NEW_COLUMNS = {
    "users": {
        "name": "VARCHAR NOT NULL DEFAULT ''",
        "is_admin": "BOOLEAN NOT NULL DEFAULT FALSE",
        "reset_code_expires": "TIMESTAMP",
    },
    "tasks": {
        "priority": "VARCHAR NOT NULL DEFAULT 'medium'",
        "due_at": "TIMESTAMP",
        "reminder_sent": "BOOLEAN NOT NULL DEFAULT FALSE",
        "completed_at": "TIMESTAMP",
    },
}

# Run once, right after the column is added, to fill it in for rows that already exist.
# Tasks completed before completed_at existed get their creation time as the best estimate.
BACKFILLS = {
    ("tasks", "completed_at"): "UPDATE tasks SET completed_at = created_at WHERE completed = TRUE AND completed_at IS NULL",
}


def run_migrations(engine):
    inspector = inspect(engine)
    for table, columns in NEW_COLUMNS.items():
        existing = {column["name"] for column in inspector.get_columns(table)}
        for name, definition in columns.items():
            if name not in existing:
                with engine.begin() as connection:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {definition}"))
                    if (table, name) in BACKFILLS:
                        connection.execute(text(BACKFILLS[(table, name)]))
