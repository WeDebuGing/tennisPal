from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, date
import json

db = SQLAlchemy()


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    ntrp = db.Column(db.Float, nullable=True)
    elo = db.Column(db.Integer, default=1200)
    city = db.Column(db.String(100), default="Pittsburgh")
    preferred_courts = db.Column(db.String(500), nullable=True)
    notify_sms = db.Column(db.Boolean, default=False)
    notify_email = db.Column(db.Boolean, default=True)
    is_admin = db.Column(db.Boolean, default=False)
    is_banned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    availabilities = db.relationship('Availability', backref='user', lazy=True, cascade='all,delete-orphan')
    posts = db.relationship('LookingToPlay', backref='author', lazy=True, foreign_keys='LookingToPlay.user_id')

    @property
    def wins(self):
        return sum(1 for m in Match.query.filter(Match.score_confirmed == True).filter(
            (Match.player1_id == self.id) | (Match.player2_id == self.id)).all() if m.winner_id == self.id)

    @property
    def losses(self):
        return sum(1 for m in Match.query.filter(Match.score_confirmed == True).filter(
            (Match.player1_id == self.id) | (Match.player2_id == self.id)).all() if m.winner_id and m.winner_id != self.id)

    @property
    def matches_played(self):
        return Match.query.filter(Match.score_confirmed == True).filter(
            (Match.player1_id == self.id) | (Match.player2_id == self.id)).count()

    @property
    def unique_opponents(self):
        ids = set()
        for m in Match.query.filter(Match.score_confirmed == True).filter(
                (Match.player1_id == self.id) | (Match.player2_id == self.id)).all():
            ids.add(m.player2_id if m.player1_id == self.id else m.player1_id)
        return len(ids)

    @property
    def reliability(self):
        total = Match.query.filter(Match.status.in_(['completed', 'cancelled', 'no_show'])).filter(
            (Match.player1_id == self.id) | (Match.player2_id == self.id)).count()
        if total == 0:
            return 100
        played = Match.query.filter(Match.status == 'completed').filter(
            (Match.player1_id == self.id) | (Match.player2_id == self.id)).count()
        return round(played / total * 100)

    def to_dict(self, brief=False):
        d = {'id': self.id, 'name': self.name, 'ntrp': self.ntrp, 'elo': self.elo}
        if not brief:
            d.update({
                'email': self.email, 'phone': self.phone, 'preferred_courts': self.preferred_courts,
                'wins': self.wins, 'losses': self.losses,
                'matches_played': self.matches_played,
                'unique_opponents': self.unique_opponents,
                'reliability': self.reliability,
                'is_admin': self.is_admin,
                'is_banned': self.is_banned,
                'availabilities': [a.to_dict() for a in self.availabilities],
                'created_at': self.created_at.isoformat() if self.created_at else None,
            })
        return d


class Availability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)

    DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    @property
    def day_name(self):
        return self.DAY_NAMES[self.day_of_week]

    def to_dict(self):
        return {'id': self.id, 'user_id': self.user_id, 'day_of_week': self.day_of_week,
                'day_name': self.day_name, 'start_time': self.start_time, 'end_time': self.end_time}


class LookingToPlay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    play_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)
    court = db.Column(db.String(100), default='Flexible')
    match_type = db.Column(db.String(20), default='singles')
    level_min = db.Column(db.Float, nullable=True)
    level_max = db.Column(db.Float, nullable=True)
    claimed_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    claimed_by = db.relationship('User', foreign_keys=[claimed_by_id])

    @property
    def is_expired(self):
        end = datetime.combine(self.play_date, datetime.strptime(self.end_time, '%H:%M').time())
        return datetime.now() > end

    @property
    def is_active(self):
        return not self.is_expired and self.claimed_by_id is None

    def to_dict(self):
        author = User.query.get(self.user_id)
        return {
            'id': self.id, 'user_id': self.user_id,
            'author_name': author.name if author else None,
            'author_ntrp': author.ntrp if author else None,
            'play_date': self.play_date.isoformat(),
            'start_time': self.start_time, 'end_time': self.end_time,
            'court': self.court, 'match_type': self.match_type,
            'level_min': self.level_min, 'level_max': self.level_max,
            'claimed_by_id': self.claimed_by_id,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class MatchInvite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    play_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)
    court = db.Column(db.String(100), default='TBD')
    match_type = db.Column(db.String(20), default='singles')
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    from_user = db.relationship('User', foreign_keys=[from_user_id])
    to_user = db.relationship('User', foreign_keys=[to_user_id])

    def to_dict(self):
        return {
            'id': self.id,
            'from_user': {'id': self.from_user.id, 'name': self.from_user.name} if self.from_user else None,
            'to_user': {'id': self.to_user.id, 'name': self.to_user.name} if self.to_user else None,
            'play_date': self.play_date.isoformat(),
            'start_time': self.start_time, 'end_time': self.end_time,
            'court': self.court, 'match_type': self.match_type, 'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Match(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player1_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    player2_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    play_date = db.Column(db.Date, nullable=False)
    match_type = db.Column(db.String(20), default='singles')
    status = db.Column(db.String(20), default='scheduled')
    score = db.Column(db.String(100), nullable=True)
    sets = db.Column(db.Text, nullable=True)  # JSON: [{"p1":6,"p2":4},{"p1":6,"p2":3}]
    match_format = db.Column(db.String(30), default='best_of_3')  # best_of_3, pro_set, best_of_5
    score_submitted_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    score_confirmed = db.Column(db.Boolean, default=False)
    score_disputed = db.Column(db.Boolean, default=False)
    winner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    player1 = db.relationship('User', foreign_keys=[player1_id])
    player2 = db.relationship('User', foreign_keys=[player2_id])
    winner = db.relationship('User', foreign_keys=[winner_id])

    def to_dict(self):
        return {
            'id': self.id,
            'player1': {'id': self.player1.id, 'name': self.player1.name} if self.player1 else None,
            'player2': {'id': self.player2.id, 'name': self.player2.name} if self.player2 else None,
            'play_date': self.play_date.isoformat(),
            'match_type': self.match_type, 'match_format': self.match_format, 'status': self.status,
            'score': self.score, 'sets': json.loads(self.sets) if self.sets else None,
            'score_submitted_by': self.score_submitted_by,
            'score_confirmed': self.score_confirmed, 'score_disputed': self.score_disputed,
            'winner_id': self.winner_id,
            'winner_name': self.winner.name if self.winner else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class ReviewTag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    category = db.Column(db.String(30), nullable=False)  # play_style, sportsmanship, logistics, vibe

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'category': self.category}


# Association table for PlayerReview <-> ReviewTag
review_tags_assoc = db.Table('review_tags_assoc',
    db.Column('review_id', db.Integer, db.ForeignKey('player_review.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('review_tag.id'), primary_key=True),
)


class PlayerReview(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reviewee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    match_id = db.Column(db.Integer, db.ForeignKey('match.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reviewer = db.relationship('User', foreign_keys=[reviewer_id])
    reviewee = db.relationship('User', foreign_keys=[reviewee_id])
    match = db.relationship('Match', backref='reviews')
    tags = db.relationship('ReviewTag', secondary=review_tags_assoc, lazy='joined')

    __table_args__ = (db.UniqueConstraint('reviewer_id', 'match_id', name='uq_reviewer_match'),)

    def to_dict(self):
        return {
            'id': self.id, 'reviewer_id': self.reviewer_id,
            'reviewee_id': self.reviewee_id, 'match_id': self.match_id,
            'tags': [t.to_dict() for t in self.tags],
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }


class Court(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(300))
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    num_courts = db.Column(db.Integer, default=1)
    lighted = db.Column(db.Boolean, default=False)
    surface = db.Column(db.String(50), default='hard')
    public = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {k: getattr(self, k) for k in ['id', 'name', 'address', 'lat', 'lng', 'num_courts', 'lighted', 'surface', 'public']}


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    link = db.Column(db.String(200), nullable=True)

    user = db.relationship('User', backref='notifications')

    def to_dict(self):
        return {'id': self.id, 'message': self.message, 'read': self.read,
                'created_at': self.created_at.isoformat() if self.created_at else None, 'link': self.link}
