"""Migration: Add League, LeagueMembership tables and league fields to Match/MatchInvite."""
from models import db


def migrate():
    # Add league fields to match table
    for col, typedef in [
        ('league_id', 'INTEGER REFERENCES league(id)'),
        ('is_challenge', 'BOOLEAN DEFAULT 0'),
        ('elo_change_p1', 'INTEGER'),
        ('elo_change_p2', 'INTEGER'),
    ]:
        try:
            db.session.execute(db.text(f"ALTER TABLE match ADD COLUMN {col} {typedef}"))
            db.session.commit()
        except Exception:
            db.session.rollback()
    # Add league fields to match_invite table
    for col, typedef in [
        ('league_id', 'INTEGER REFERENCES league(id)'),
        ('is_challenge', 'BOOLEAN DEFAULT 0'),
    ]:
        try:
            db.session.execute(db.text(f"ALTER TABLE match_invite ADD COLUMN {col} {typedef}"))
            db.session.commit()
        except Exception:
            db.session.rollback()
