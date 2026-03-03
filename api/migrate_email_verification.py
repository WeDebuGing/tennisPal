"""Migration: Add email verification columns to user table.

Run once: python migrate_email_verification.py

Safe to re-run — uses IF NOT EXISTS-style ALTER TABLE (catches errors on duplicate columns).
Grandfathers all existing users as email_verified = True.
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
        ("email_verified", "BOOLEAN DEFAULT 0"),
        ("verification_token", "VARCHAR(100)"),
        ("verification_sent_at", "DATETIME"),
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

    # Grandfather existing users as verified
    cur.execute("UPDATE user SET email_verified = 1 WHERE email_verified IS NULL OR email_verified = 0")
    print(f"  Grandfathered {cur.rowcount} existing users as email_verified")

    conn.commit()
    conn.close()
    print("Migration complete.")


if __name__ == '__main__':
    migrate()
