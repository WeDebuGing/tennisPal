"""Seed database with ~20 sample players and fake data."""
import os, sys, random
from datetime import date, timedelta
from werkzeug.security import generate_password_hash
from faker import Faker

fake = Faker()
Faker.seed(42)
random.seed(42)

# Bootstrap Flask app
from app import app, db
from models import User, Availability, LookingToPlay, Match

NTRP_LEVELS = [2.5, 3.0, 3.0, 3.5, 3.5, 3.5, 4.0, 4.0, 4.0, 4.0, 4.5, 4.5, 4.5, 5.0, 5.0, 5.5, 3.0, 3.5, 4.0, 4.5]
COURTS = ['Central Park Courts', 'Riverside Tennis Club', 'Hudson River Courts', 'Brooklyn Bridge Park', 'Prospect Park', 'USTA Center', 'Flexible']

with app.app_context():
    if User.query.count() > 0:
        print("Database already seeded.")
        sys.exit(0)

    pw = generate_password_hash('tennis123')
    users = []
    for i in range(20):
        u = User(
            name=fake.name(),
            email=fake.unique.email(),
            phone=fake.unique.numerify('###-###-####'),
            password_hash=pw,
            ntrp=NTRP_LEVELS[i],
            elo=random.randint(1000, 1600),
        )
        db.session.add(u)
        users.append(u)
    db.session.flush()

    # Availability
    for u in users:
        for _ in range(random.randint(1, 3)):
            day = random.randint(0, 6)
            hour = random.choice([7, 8, 9, 10, 16, 17, 18, 19])
            a = Availability(user_id=u.id, day_of_week=day,
                             start_time=f"{hour:02d}:00", end_time=f"{hour+2:02d}:00")
            db.session.add(a)

    # Looking to Play posts
    today = date.today()
    for i in range(8):
        u = random.choice(users)
        d = today + timedelta(days=random.randint(0, 6))
        h = random.choice([9, 10, 11, 14, 15, 16, 17, 18])
        p = LookingToPlay(
            user_id=u.id, play_date=d,
            start_time=f"{h:02d}:00", end_time=f"{h+2:02d}:00",
            court=random.choice(COURTS),
            match_type=random.choice(['singles', 'doubles', 'hitting']),
            level_min=u.ntrp - 0.5 if u.ntrp else None,
            level_max=u.ntrp + 0.5 if u.ntrp else None,
        )
        db.session.add(p)

    # Past matches with scores
    for _ in range(30):
        p1, p2 = random.sample(users, 2)
        d = today - timedelta(days=random.randint(1, 60))
        winner = random.choice([p1, p2])
        scores = random.choice(['6-4, 6-3', '7-5, 6-4', '6-3, 4-6, 7-5', '6-2, 6-1', '7-6, 3-6, 6-4', '6-4, 6-4'])
        m = Match(
            player1_id=p1.id, player2_id=p2.id,
            play_date=d, match_type='singles',
            status='completed', score=scores,
            score_submitted_by=p1.id, score_confirmed=True,
            winner_id=winner.id,
        )
        db.session.add(m)

    db.session.commit()
    print(f"Seeded {len(users)} players, 8 posts, 30 matches.")
