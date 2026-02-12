from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime, date

db = SQLAlchemy()


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    phone = db.Column(db.String(20), unique=True, nullable=True)
    password_hash = db.Column(db.String(256), nullable=False)
    ntrp = db.Column(db.Float, nullable=True)
    elo = db.Column(db.Integer, default=1200)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    availabilities = db.relationship('Availability', backref='user', lazy=True, cascade='all,delete-orphan')
    posts = db.relationship('LookingToPlay', backref='author', lazy=True, foreign_keys='LookingToPlay.user_id')

    @property
    def wins(self):
        w = 0
        for m in Match.query.filter(Match.score_confirmed == True).filter(
                (Match.player1_id == self.id) | (Match.player2_id == self.id)).all():
            if m.winner_id == self.id:
                w += 1
        return w

    @property
    def losses(self):
        confirmed = Match.query.filter(Match.score_confirmed == True).filter(
            (Match.player1_id == self.id) | (Match.player2_id == self.id)).all()
        return sum(1 for m in confirmed if m.winner_id and m.winner_id != self.id)

    @property
    def matches_played(self):
        return Match.query.filter(Match.score_confirmed == True).filter(
            (Match.player1_id == self.id) | (Match.player2_id == self.id)).count()

    @property
    def unique_opponents(self):
        ids = set()
        for m in Match.query.filter(Match.score_confirmed == True).filter(
                (Match.player1_id == self.id) | (Match.player2_id == self.id)).all():
            opp = m.player2_id if m.player1_id == self.id else m.player1_id
            ids.add(opp)
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


class Availability(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    day_of_week = db.Column(db.Integer, nullable=False)  # 0=Mon, 6=Sun
    start_time = db.Column(db.String(5), nullable=False)  # HH:MM
    end_time = db.Column(db.String(5), nullable=False)

    DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    @property
    def day_name(self):
        return self.DAY_NAMES[self.day_of_week]

    @property
    def display(self):
        from datetime import datetime as dt
        s = dt.strptime(self.start_time, '%H:%M').strftime('%-I:%M%p').lower()
        e = dt.strptime(self.end_time, '%H:%M').strftime('%-I:%M%p').lower()
        return f"{self.day_name} {s}–{e}"


class LookingToPlay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    play_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)
    court = db.Column(db.String(100), default='Flexible')
    match_type = db.Column(db.String(20), default='singles')  # singles/doubles/hitting
    level_min = db.Column(db.Float, nullable=True)
    level_max = db.Column(db.Float, nullable=True)
    claimed_by_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    claimed_by = db.relationship('User', foreign_keys=[claimed_by_id])

    @property
    def is_expired(self):
        from datetime import datetime as dt
        end = dt.combine(self.play_date, dt.strptime(self.end_time, '%H:%M').time())
        return dt.now() > end

    @property
    def is_active(self):
        return not self.is_expired and self.claimed_by_id is None


class MatchInvite(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    from_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    to_user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    play_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(5), nullable=False)
    end_time = db.Column(db.String(5), nullable=False)
    court = db.Column(db.String(100), default='TBD')
    match_type = db.Column(db.String(20), default='singles')
    status = db.Column(db.String(20), default='pending')  # pending/accepted/declined
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    from_user = db.relationship('User', foreign_keys=[from_user_id])
    to_user = db.relationship('User', foreign_keys=[to_user_id])


class Match(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    player1_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    player2_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    play_date = db.Column(db.Date, nullable=False)
    match_type = db.Column(db.String(20), default='singles')
    status = db.Column(db.String(20), default='scheduled')  # scheduled/completed/cancelled/no_show
    score = db.Column(db.String(100), nullable=True)
    score_submitted_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    score_confirmed = db.Column(db.Boolean, default=False)
    score_disputed = db.Column(db.Boolean, default=False)
    winner_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    player1 = db.relationship('User', foreign_keys=[player1_id])
    player2 = db.relationship('User', foreign_keys=[player2_id])
    winner = db.relationship('User', foreign_keys=[winner_id])

    def opponent(self, user_id):
        return self.player2 if self.player1_id == user_id else self.player1


class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    message = db.Column(db.String(500), nullable=False)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    link = db.Column(db.String(200), nullable=True)

    user = db.relationship('User', backref='notifications')
