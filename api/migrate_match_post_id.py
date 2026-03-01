"""Add post_id column to the match table for the request/accept flow."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'tennispal.db')

MIGRATIONS = [
    ("post_id", "ALTER TABLE match ADD COLUMN post_id INTEGER REFERENCES looking_to_play(id)"),
]


def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    existing = {col[1] for col in cur.execute("PRAGMA table_info(match)").fetchall()}
    for col_name, sql in MIGRATIONS:
        if col_name not in existing:
            print(f"Adding column: {col_name}")
            cur.execute(sql)
        else:
            print(f"Column already exists: {col_name}")
    conn.commit()
    conn.close()
    print("Migration complete.")


if __name__ == '__main__':
    migrate()
