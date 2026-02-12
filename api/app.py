from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Availability, LookingToPlay, MatchInvite, Match, Notification
from datetime import datetime, date, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tennispal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-dev-secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)

db.init_app(app)
CORS(app)
jwt = JWTManager(app)


# ── Auth ──

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip() or None
    phone = data.get('phone', '').strip() or None
    password = data.get('password', '')
    ntrp = data.get('ntrp')
    ntrp = float(ntrp) if ntrp else None

    if not name or not password:
        return jsonify(error='Name and password required.'), 400
    if not email and not phone:
        return jsonify(error='Provide email or phone.'), 400
    if email and User.query.filter_by(email=email).first():
        return jsonify(error='Email already registered.'), 409
    if phone and User.query.filter_by(phone=phone).first():
        return jsonify(error='Phone already registered.'), 409

    user = User(name=name, email=email, phone=phone,
                password_hash=generate_password_hash(password), ntrp=ntrp)
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify(token=token, user=user.to_dict()), 201


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    identifier = data.get('identifier', '').strip()
    password = data.get('password', '')
    user = User.query.filter((User.email == identifier) | (User.phone == identifier)).first()
    if user and check_password_hash(user.password_hash, password):
        token = create_access_token(identity=str(user.id))
        return jsonify(token=token, user=user.to_dict())
    return jsonify(error='Invalid credentials.'), 401


@app.route('/api/auth/me')
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify(error='User not found.'), 404
    return jsonify(user=user.to_dict())


# ── Feed (Posts) ──

@app.route('/api/posts')
def get_posts():
    posts = LookingToPlay.query.filter(
        LookingToPlay.claimed_by_id.is_(None),
        LookingToPlay.play_date >= date.today()
    ).order_by(LookingToPlay.play_date, LookingToPlay.start_time).all()
    return jsonify(posts=[p.to_dict() for p in posts if p.is_active])


@app.route('/api/posts', methods=['POST'])
@jwt_required()
def create_post():
    uid = int(get_jwt_identity())
    data = request.get_json()
    p = LookingToPlay(
        user_id=uid,
        play_date=datetime.strptime(data['play_date'], '%Y-%m-%d').date(),
        start_time=data['start_time'], end_time=data['end_time'],
        court=data.get('court', 'Flexible') or 'Flexible',
        match_type=data.get('match_type', 'singles'),
        level_min=float(data['level_min']) if data.get('level_min') else None,
        level_max=float(data['level_max']) if data.get('level_max') else None,
    )
    db.session.add(p)
    db.session.commit()
    return jsonify(post=p.to_dict()), 201


@app.route('/api/posts/<int:post_id>/claim', methods=['POST'])
@jwt_required()
def claim_post(post_id):
    uid = int(get_jwt_identity())
    post = LookingToPlay.query.get_or_404(post_id)
    if post.user_id == uid:
        return jsonify(error="Can't claim your own post."), 400
    if not post.is_active:
        return jsonify(error='Post no longer available.'), 400
    post.claimed_by_id = uid
    match = Match(player1_id=post.user_id, player2_id=uid,
                  play_date=post.play_date, match_type=post.match_type)
    db.session.add(match)
    user = User.query.get(uid)
    n = Notification(user_id=post.user_id,
                     message=f"{user.name} claimed your post for {post.play_date.strftime('%b %d')}!")
    db.session.add(n)
    db.session.commit()
    return jsonify(match=match.to_dict()), 201


# ── Players ──

@app.route('/api/players')
def get_players():
    day = request.args.get('day', '')
    users = User.query.order_by(User.name).all()
    if day != '':
        day_int = int(day)
        user_ids = {a.user_id for a in Availability.query.filter_by(day_of_week=day_int).all()}
        users = [u for u in users if u.id in user_ids]
    return jsonify(players=[u.to_dict(brief=True) for u in users])


@app.route('/api/players/<int:user_id>')
def get_player(user_id):
    user = User.query.get_or_404(user_id)
    data = user.to_dict()
    # Match history
    matches = Match.query.filter(
        (Match.player1_id == user_id) | (Match.player2_id == user_id)
    ).order_by(Match.play_date.desc()).all()
    data['match_history'] = [m.to_dict() for m in matches]
    return jsonify(player=data)


@app.route('/api/players/<int:user_id>/h2h')
@jwt_required()
def get_h2h(user_id):
    uid = int(get_jwt_identity())
    if uid == user_id:
        return jsonify(h2h=None)
    h2h_matches = Match.query.filter(Match.score_confirmed == True).filter(
        ((Match.player1_id == uid) & (Match.player2_id == user_id)) |
        ((Match.player1_id == user_id) & (Match.player2_id == uid))
    ).all()
    w = sum(1 for m in h2h_matches if m.winner_id == uid)
    l = sum(1 for m in h2h_matches if m.winner_id == user_id)
    return jsonify(h2h={'wins': w, 'losses': l, 'matches': [m.to_dict() for m in h2h_matches]})


# ── Availability ──

@app.route('/api/availability')
@jwt_required()
def get_availability():
    uid = int(get_jwt_identity())
    slots = Availability.query.filter_by(user_id=uid).order_by(Availability.day_of_week).all()
    return jsonify(slots=[s.to_dict() for s in slots])


@app.route('/api/availability', methods=['POST'])
@jwt_required()
def add_availability():
    uid = int(get_jwt_identity())
    data = request.get_json()
    a = Availability(user_id=uid, day_of_week=int(data['day_of_week']),
                     start_time=data['start_time'], end_time=data['end_time'])
    db.session.add(a)
    db.session.commit()
    return jsonify(slot=a.to_dict()), 201


@app.route('/api/availability/<int:slot_id>', methods=['DELETE'])
@jwt_required()
def delete_availability(slot_id):
    uid = int(get_jwt_identity())
    a = Availability.query.get_or_404(slot_id)
    if a.user_id != uid:
        return jsonify(error='Not authorized.'), 403
    db.session.delete(a)
    db.session.commit()
    return jsonify(ok=True)


# ── Invites ──

@app.route('/api/invites', methods=['POST'])
@jwt_required()
def send_invite():
    uid = int(get_jwt_identity())
    data = request.get_json()
    to_user_id = int(data['to_user_id'])
    inv = MatchInvite(
        from_user_id=uid, to_user_id=to_user_id,
        play_date=datetime.strptime(data['play_date'], '%Y-%m-%d').date(),
        start_time=data['start_time'], end_time=data['end_time'],
        court=data.get('court', 'TBD'), match_type=data.get('match_type', 'singles'),
    )
    db.session.add(inv)
    user = User.query.get(uid)
    n = Notification(user_id=to_user_id,
                     message=f"{user.name} invited you to play on {inv.play_date.strftime('%b %d')}!")
    db.session.add(n)
    db.session.commit()
    return jsonify(invite=inv.to_dict()), 201


@app.route('/api/invites/<int:invite_id>/accept', methods=['POST'])
@jwt_required()
def accept_invite(invite_id):
    uid = int(get_jwt_identity())
    inv = MatchInvite.query.get_or_404(invite_id)
    if inv.to_user_id != uid:
        return jsonify(error='Not authorized.'), 403
    inv.status = 'accepted'
    match = Match(player1_id=inv.from_user_id, player2_id=inv.to_user_id,
                  play_date=inv.play_date, match_type=inv.match_type)
    db.session.add(match)
    user = User.query.get(uid)
    n = Notification(user_id=inv.from_user_id,
                     message=f"{user.name} accepted your invite for {inv.play_date.strftime('%b %d')}!")
    db.session.add(n)
    db.session.commit()
    return jsonify(match=match.to_dict())


@app.route('/api/invites/<int:invite_id>/decline', methods=['POST'])
@jwt_required()
def decline_invite(invite_id):
    uid = int(get_jwt_identity())
    inv = MatchInvite.query.get_or_404(invite_id)
    if inv.to_user_id != uid:
        return jsonify(error='Not authorized.'), 403
    inv.status = 'declined'
    user = User.query.get(uid)
    n = Notification(user_id=inv.from_user_id, message=f"{user.name} declined your invite.")
    db.session.add(n)
    db.session.commit()
    return jsonify(ok=True)


# ── Matches ──

@app.route('/api/matches')
@jwt_required()
def get_matches():
    uid = int(get_jwt_identity())
    matches = Match.query.filter(
        (Match.player1_id == uid) | (Match.player2_id == uid)
    ).order_by(Match.play_date.desc()).all()
    pending = MatchInvite.query.filter_by(to_user_id=uid, status='pending').all()
    sent = MatchInvite.query.filter_by(from_user_id=uid, status='pending').all()
    return jsonify(matches=[m.to_dict() for m in matches],
                   pending_invites=[i.to_dict() for i in pending],
                   sent_invites=[i.to_dict() for i in sent])


@app.route('/api/matches/<int:match_id>')
@jwt_required()
def get_match(match_id):
    match = Match.query.get_or_404(match_id)
    return jsonify(match=match.to_dict())


@app.route('/api/matches/<int:match_id>/score', methods=['POST'])
@jwt_required()
def submit_score(match_id):
    uid = int(get_jwt_identity())
    match = Match.query.get_or_404(match_id)
    if uid not in (match.player1_id, match.player2_id):
        return jsonify(error='Not authorized.'), 403
    data = request.get_json()
    match.score = data['score'].strip()
    match.winner_id = int(data['winner_id'])
    match.score_submitted_by = uid
    match.status = 'completed'
    match.score_confirmed = False
    match.score_disputed = False
    opp_id = match.player2_id if match.player1_id == uid else match.player1_id
    user = User.query.get(uid)
    n = Notification(user_id=opp_id,
                     message=f"{user.name} submitted a score: {match.score}. Please confirm.")
    db.session.add(n)
    db.session.commit()
    return jsonify(match=match.to_dict())


@app.route('/api/matches/<int:match_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_score(match_id):
    uid = int(get_jwt_identity())
    match = Match.query.get_or_404(match_id)
    if uid == match.score_submitted_by:
        return jsonify(error="You can't confirm your own score."), 400
    data = request.get_json()
    action = data.get('action', 'confirm')
    if action == 'confirm':
        match.score_confirmed = True
    else:
        match.score_disputed = True
    db.session.commit()
    return jsonify(match=match.to_dict())


@app.route('/api/matches/<int:match_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_match(match_id):
    uid = int(get_jwt_identity())
    match = Match.query.get_or_404(match_id)
    if uid not in (match.player1_id, match.player2_id):
        return jsonify(error='Not authorized.'), 403
    match.status = 'cancelled'
    db.session.commit()
    return jsonify(match=match.to_dict())


# ── Leaderboard ──

@app.route('/api/leaderboard')
def leaderboard():
    users = User.query.all()
    board = sorted(users, key=lambda u: u.wins, reverse=True)
    return jsonify(leaderboard=[{
        'id': u.id, 'name': u.name, 'ntrp': u.ntrp, 'elo': u.elo,
        'wins': u.wins, 'losses': u.losses, 'matches_played': u.matches_played,
    } for u in board])


# ── Notifications ──

@app.route('/api/notifications')
@jwt_required()
def get_notifications():
    uid = int(get_jwt_identity())
    notes = Notification.query.filter_by(user_id=uid).order_by(Notification.created_at.desc()).limit(50).all()
    result = [n.to_dict() for n in notes]
    Notification.query.filter_by(user_id=uid, read=False).update({'read': True})
    db.session.commit()
    return jsonify(notifications=result)


# ── Init ──

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5001)
