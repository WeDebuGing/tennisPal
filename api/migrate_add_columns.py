"""Add missing columns to the user table."""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'tennispal.db')

MIGRATIONS = [
    ("city", "ALTER TABLE user ADD COLUMN city VARCHAR(100) DEFAULT 'Pittsburgh'"),
    ("preferred_courts", "ALTER TABLE user ADD COLUMN preferred_courts TEXT"),
    ("is_admin", "ALTER TABLE user ADD COLUMN is_admin BOOLEAN DEFAULT 0"),
    ("is_banned", "ALTER TABLE user ADD COLUMN is_banned BOOLEAN DEFAULT 0"),
    ("onboarding_complete", "ALTER TABLE user ADD COLUMN onboarding_complete BOOLEAN DEFAULT 0"),
]

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    existing = {col[1] for col in cur.execute("PRAGMA table_info(user)").fetchall()}
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
