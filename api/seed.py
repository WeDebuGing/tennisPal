"""Seed the database with test users, matches, availability, and posts."""
from app import app, db
from models import User, Availability, LookingToPlay, Match, MatchInvite, Notification, Court, ReviewTag, PlayerReview
from werkzeug.security import generate_password_hash
from datetime import date, datetime, timedelta
import json, random

USERS = [
    {"name": "Gordon", "email": "gordon@tennispal.com", "password": "tennis123", "ntrp": 3.5, "elo": 1210},
    {"name": "Sarah Chen", "email": "sarah@tennispal.com", "password": "tennis123", "ntrp": 4.0, "elo": 1350},
    {"name": "Mike Johnson", "email": "mike@tennispal.com", "password": "tennis123", "ntrp": 3.0, "elo": 1100},
    {"name": "Emily Davis", "email": "emily@tennispal.com", "password": "tennis123", "ntrp": 3.5, "elo": 1180},
    {"name": "Raj Patel", "email": "raj@tennispal.com", "password": "tennis123", "ntrp": 4.5, "elo": 1500},
    {"name": "Lisa Wong", "email": "lisa@tennispal.com", "password": "tennis123", "ntrp": 3.0, "elo": 1050},
    {"name": "James Miller", "email": "james@tennispal.com", "password": "tennis123", "ntrp": 4.0, "elo": 1320},
    {"name": "Ana Rodriguez", "email": "ana@tennispal.com", "password": "tennis123", "ntrp": 3.5, "elo": 1240},
    {"name": "Tom Wilson", "email": "tom@tennispal.com", "password": "tennis123", "ntrp": 2.5, "elo": 950},
    {"name": "Priya Sharma", "email": "priya@tennispal.com", "password": "tennis123", "ntrp": 4.0, "elo": 1380},
]

# (user_idx, day_of_week, start, end)
AVAILABILITY = [
    (0, 5, "09:00", "12:00"), (0, 6, "10:00", "14:00"), (0, 2, "18:00", "20:00"),
    (1, 5, "08:00", "11:00"), (1, 6, "09:00", "13:00"),
    (2, 0, "18:00", "20:00"), (2, 3, "18:00", "20:00"), (2, 5, "10:00", "14:00"),
    (3, 1, "17:00", "19:00"), (3, 5, "09:00", "12:00"), (3, 6, "09:00", "12:00"),
    (4, 5, "07:00", "10:00"), (4, 6, "07:00", "10:00"),
    (5, 2, "18:00", "20:00"), (5, 4, "18:00", "20:00"), (5, 6, "14:00", "17:00"),
    (6, 5, "10:00", "13:00"), (6, 6, "10:00", "13:00"), (6, 3, "19:00", "21:00"),
    (7, 1, "18:00", "20:00"), (7, 5, "11:00", "14:00"),
    (8, 5, "14:00", "17:00"), (8, 6, "14:00", "17:00"),
    (9, 5, "08:00", "11:00"), (9, 6, "08:00", "11:00"), (9, 0, "17:00", "19:00"),
]

# (p1_idx, p2_idx, days_ago, format, sets_data, winner_idx)
MATCHES = [
    (0, 3, 3, "best_of_3", [{"p1": 6, "p2": 4}, {"p1": 6, "p2": 3}], 0),
    (0, 2, 10, "best_of_3", [{"p1": 6, "p2": 2}, {"p1": 6, "p2": 1}], 0),
    (0, 1, 17, "best_of_3", [{"p1": 4, "p2": 6}, {"p1": 6, "p2": 7, "tiebreak": {"p1": 5, "p2": 7}}, {"p1": 3, "p2": 6}], 1),
    (1, 4, 5, "best_of_3", [{"p1": 6, "p2": 7, "tiebreak": {"p1": 4, "p2": 7}}, {"p1": 6, "p2": 4}, {"p1": 4, "p2": 6}], 4),
    (1, 7, 12, "best_of_3", [{"p1": 6, "p2": 3}, {"p1": 6, "p2": 4}], 1),
    (2, 5, 7, "best_of_3", [{"p1": 6, "p2": 4}, {"p1": 3, "p2": 6}, {"p1": 7, "p2": 6, "tiebreak": {"p1": 7, "p2": 5}}], 2),
    (2, 8, 14, "best_of_3", [{"p1": 6, "p2": 3}, {"p1": 6, "p2": 2}], 2),
    (3, 7, 8, "best_of_3", [{"p1": 3, "p2": 6}, {"p1": 6, "p2": 4}, {"p1": 6, "p2": 7, "tiebreak": {"p1": 3, "p2": 7}}], 7),
    (4, 6, 4, "best_of_3", [{"p1": 6, "p2": 4}, {"p1": 6, "p2": 3}], 4),
    (4, 9, 11, "best_of_3", [{"p1": 7, "p2": 6, "tiebreak": {"p1": 7, "p2": 5}}, {"p1": 6, "p2": 4}], 4),
    (5, 8, 6, "best_of_3", [{"p1": 4, "p2": 6}, {"p1": 6, "p2": 3}, {"p1": 6, "p2": 4}], 5),
    (6, 9, 9, "best_of_3", [{"p1": 6, "p2": 7, "tiebreak": {"p1": 5, "p2": 7}}, {"p1": 6, "p2": 4}, {"p1": 6, "p2": 3}], 6),
    (0, 6, 21, "best_of_3", [{"p1": 3, "p2": 6}, {"p1": 6, "p2": 4}, {"p1": 4, "p2": 6}], 6),
    (7, 9, 15, "best_of_3", [{"p1": 6, "p2": 4}, {"p1": 4, "p2": 6}, {"p1": 7, "p2": 6, "tiebreak": {"p1": 7, "p2": 4}}], 7),
]

COURT_NAMES = ["Schenley Park Courts", "Mellon Park Tennis", "Highland Park Courts", "CMU Tennis Courts", "Frick Park Courts"]

PITTSBURGH_COURTS = [
    {"name": "Arsenal Park", "address": "290 39th St, Pittsburgh PA 15201", "lat": 40.465322, "lng": -79.961233, "num_courts": 4, "lighted": True, "public": True},
    {"name": "Allegheny Commons West Park", "address": "Ridge Ave & W Ohio St, Pittsburgh PA 15212", "lat": 40.451527, "lng": -80.011057, "num_courts": 3, "lighted": True, "public": True},
    {"name": "Allegheny Commons North Park", "address": "8 N Commons, Pittsburgh PA 15212", "lat": 40.453530, "lng": -80.006802, "num_courts": 2, "lighted": True, "public": True},
    {"name": "Carnegie Mellon University", "address": "5000 Forbes Ave, Pittsburgh PA 15213", "lat": 40.444167, "lng": -79.943361, "num_courts": 6, "lighted": True, "public": False},
    {"name": "Schenley Park", "address": "Overlook Dr, Pittsburgh PA 15213", "lat": 40.435000, "lng": -79.942000, "num_courts": 8, "lighted": True, "public": True},
    {"name": "Mellon Park", "address": "1 Overlook Dr, Pittsburgh PA 15217", "lat": 40.452700, "lng": -79.919500, "num_courts": 6, "lighted": True, "public": True},
    {"name": "Highland Park", "address": "Highland Ave, Pittsburgh PA 15206", "lat": 40.473592, "lng": -79.911404, "num_courts": 4, "lighted": False, "public": True},
    {"name": "Frick Park", "address": "2005 Beechwood Blvd, Pittsburgh PA 15217", "lat": 40.432800, "lng": -79.907500, "num_courts": 4, "lighted": False, "public": True},
    {"name": "Washington's Landing", "address": "200 Waterfront Dr, Pittsburgh PA 15222", "lat": 40.458900, "lng": -79.987800, "num_courts": 4, "lighted": True, "public": True},
    {"name": "Allderdice HS", "address": "Monmouth St, Pittsburgh PA 15217", "lat": 40.428527, "lng": -79.917264, "num_courts": 3, "lighted": False, "public": True},
    {"name": "Brashear HS", "address": "590 Crane Ave, Pittsburgh PA 15226", "lat": 40.416932, "lng": -80.019042, "num_courts": 3, "lighted": False, "public": True},
    {"name": "Davis Park", "address": "5680 Hobart St, Pittsburgh PA 15217", "lat": 40.450509, "lng": -79.936305, "num_courts": 1, "lighted": False, "public": True},
    {"name": "Moore Park", "address": "801 Pioneer Ave, Pittsburgh PA 15226", "lat": 40.412000, "lng": -80.022000, "num_courts": 2, "lighted": True, "public": True},
    {"name": "South Park", "address": "4651 Clairton Blvd, Whitehall PA 15236", "lat": 40.327000, "lng": -79.985000, "num_courts": 4, "lighted": True, "public": True},
    {"name": "North Park", "address": "1 Paul Schweiger Way, Allison Park PA 15101", "lat": 40.578000, "lng": -79.981000, "num_courts": 6, "lighted": True, "public": True},
]

def score_string(sets_data):
    parts = []
    for s in sets_data:
        part = f"{s['p1']}-{s['p2']}"
        if s.get('tiebreak') and (s['p1'] + s['p2'] == 13):
            part += f"({min(s['tiebreak']['p1'], s['tiebreak']['p2'])})"
        parts.append(part)
    return ", ".join(parts)


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # Users
        users = []
        for u in USERS:
            user = User(name=u["name"], email=u["email"],
                        password_hash=generate_password_hash(u["password"]),
                        ntrp=u["ntrp"], elo=u["elo"], onboarding_complete=True)
            db.session.add(user)
            users.append(user)
        db.session.flush()

        # Availability
        for ui, dow, start, end in AVAILABILITY:
            db.session.add(Availability(user_id=users[ui].id, day_of_week=dow,
                                        start_time=start, end_time=end))

        # Completed matches
        today = date.today()
        for p1i, p2i, days_ago, fmt, sets_data, wi in MATCHES:
            m = Match(
                player1_id=users[p1i].id, player2_id=users[p2i].id,
                play_date=today - timedelta(days=days_ago),
                match_type="singles", match_format=fmt, status="completed",
                score=score_string(sets_data), sets=json.dumps(sets_data),
                score_submitted_by=users[p1i].id,
                score_confirmed=True, winner_id=users[wi].id,
            )
            db.session.add(m)

        # Scheduled match (Gordon vs Emily, upcoming)
        db.session.add(Match(
            player1_id=users[0].id, player2_id=users[3].id,
            play_date=today + timedelta(days=2),
            match_type="singles", match_format="best_of_3", status="scheduled",
        ))

        # Looking to Play posts (future dates)
        for i, (ui, days_ahead, start, end, court) in enumerate([
            (1, 1, "10:00", "12:00", "Schenley Park Courts"),
            (4, 2, "08:00", "10:00", "Mellon Park Tennis"),
            (5, 1, "18:00", "20:00", "Highland Park Courts"),
            (8, 3, "14:00", "16:00", "CMU Tennis Courts"),
        ]):
            db.session.add(LookingToPlay(
                user_id=users[ui].id, play_date=today + timedelta(days=days_ahead),
                start_time=start, end_time=end, court=court, match_type="singles",
            ))

        # Pending invite (Raj → Gordon)
        db.session.add(MatchInvite(
            from_user_id=users[4].id, to_user_id=users[0].id,
            play_date=today + timedelta(days=4),
            start_time="09:00", end_time="11:00",
            court="Schenley Park Courts", match_type="singles", status="pending",
        ))

        # Notifications for Gordon
        db.session.add(Notification(user_id=users[0].id, message="Raj Patel invited you to play on " + (today + timedelta(days=4)).strftime("%b %d")))
        db.session.add(Notification(user_id=users[0].id, message="Your match vs Emily Davis is in 2 days!", read=True))
        db.session.add(Notification(user_id=users[0].id, message="Score confirmed: You beat Emily Davis 6-4, 6-3 🎉", read=True))

        # Review Tags
        REVIEW_TAGS = {
            'play_style': ['Big Server', 'Consistent Baseliner', 'Net Rusher', 'Heavy Topspin', 'Crafty', 'All-Court Player'],
            'sportsmanship': ['Great Sport', 'Fair Calls', 'Encouraging', 'Competitive'],
            'logistics': ['Punctual', 'Flexible Scheduling', 'Good Communication'],
            'vibe': ['Fun Rally Partner', 'Intense Competitor', 'Great for Practice'],
        }
        tag_objects = []
        for category, names in REVIEW_TAGS.items():
            for name in names:
                t = ReviewTag(name=name, category=category)
                db.session.add(t)
                tag_objects.append(t)
        db.session.flush()

        # Seed some reviews so tags show up on profiles
        # Give Gordon (user 0) several "Great Sport" and "Consistent Baseliner" reviews
        great_sport = next(t for t in tag_objects if t.name == 'Great Sport')
        consistent = next(t for t in tag_objects if t.name == 'Consistent Baseliner')
        punctual = next(t for t in tag_objects if t.name == 'Punctual')
        fun_rally = next(t for t in tag_objects if t.name == 'Fun Rally Partner')

        # Reviews for Gordon from different opponents (need confirmed matches)
        # Match 0: Gordon vs Emily (users[0] vs users[3]) - Emily reviews Gordon
        r1 = PlayerReview(reviewer_id=users[3].id, reviewee_id=users[0].id, match_id=1)
        r1.tags = [great_sport, consistent, punctual]
        db.session.add(r1)
        # Match 1: Gordon vs Mike (users[0] vs users[2]) - Mike reviews Gordon
        r2 = PlayerReview(reviewer_id=users[2].id, reviewee_id=users[0].id, match_id=2)
        r2.tags = [great_sport, fun_rally, consistent]
        db.session.add(r2)
        # Match 2: Gordon vs Sarah (users[0] vs users[1]) - Sarah reviews Gordon
        r3 = PlayerReview(reviewer_id=users[1].id, reviewee_id=users[0].id, match_id=3)
        r3.tags = [great_sport, punctual]
        db.session.add(r3)

        # Courts
        for c in PITTSBURGH_COURTS:
            db.session.add(Court(**c))

        db.session.commit()
        print(f"✅ Seeded: {len(users)} users, {len(MATCHES)} completed matches, 1 scheduled match, 4 posts, 1 invite, 3 notifications, {len(PITTSBURGH_COURTS)} courts")
        print(f"\nTest accounts (all password: tennis123):")
        for u in users:
            print(f"  {u.email:<30} {u.name:<20} NTRP {u.ntrp}  ELO {u.elo}")


def restore():
    """Restore DB from seed_snapshot.db instead of regenerating."""
    import shutil, os
    snapshot = os.path.join(os.path.dirname(__file__), "seed_snapshot.db")
    db_path = os.path.join(os.path.dirname(__file__), "instance", "tennispal.db")
    if not os.path.exists(snapshot):
        print("❌ No seed_snapshot.db found. Run `python seed.py` first to generate one.")
        return
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    shutil.copy2(snapshot, db_path)
    print(f"✅ Restored DB from seed_snapshot.db ({os.path.getsize(snapshot) // 1024}KB)")


def snapshot():
    """Save current DB as seed_snapshot.db."""
    import shutil, os
    db_path = os.path.join(os.path.dirname(__file__), "instance", "tennispal.db")
    snapshot_path = os.path.join(os.path.dirname(__file__), "seed_snapshot.db")
    if not os.path.exists(db_path):
        print("❌ No database found. Run the app first.")
        return
    shutil.copy2(db_path, snapshot_path)
    print(f"✅ Saved snapshot ({os.path.getsize(db_path) // 1024}KB)")


if __name__ == "__main__":
    import sys
    cmd = sys.argv[1] if len(sys.argv) > 1 else "seed"
    if cmd == "restore":
        restore()
    elif cmd == "snapshot":
        snapshot()
    else:
        seed()
