"""Migration: Add password reset columns to user table.

Run once: python migrate_password_reset.py

Safe to re-run — catches duplicate column errors.
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'instance', 'tennispal.db')


def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    columns = [
        ("reset_token", "VARCHAR(100)"),
        ("reset_token_expires", "DATETIME"),
    ]

    for col_name, col_type in columns:
        try:
            cur.execute(f"ALTER TABLE user ADD COLUMN {col_name} {col_type}")
            print(f"  Added column: {col_name}")
        except sqlite3.OperationalError as e:
            if "duplicate column" in str(e).lower():
                print(f"  Column already exists: {col_name}")
            else:
                raise

    conn.commit()
    conn.close()
    print("Migration complete.")


if __name__ == '__main__':
    migrate()
