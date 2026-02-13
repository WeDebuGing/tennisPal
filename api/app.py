from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Availability, LookingToPlay, MatchInvite, Match, Notification
from datetime import datetime, date, timedelta
import os
import json

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


# ── Profile ──

@app.route('/api/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user:
        return jsonify(error='User not found.'), 404
    data = request.get_json() or {}
    ALLOWED = ('name', 'phone', 'ntrp', 'city')
    for field in ALLOWED:
        if field in data:
            val = data[field]
            if field == 'name':
                val = (val or '').strip()
                if not val:
                    return jsonify(error='Name cannot be empty.'), 400
            if field == 'ntrp' and val is not None:
                val = float(val)
            if field == 'phone':
                val = (val or '').strip() or None
                if val and User.query.filter(User.phone == val, User.id != uid).first():
                    return jsonify(error='Phone already registered.'), 409
            setattr(user, field, val)
    db.session.commit()
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
    data = request.get_json() or {}
    # Bug #10: validate required fields
    missing = [f for f in ('play_date', 'start_time', 'end_time') if not data.get(f)]
    if missing:
        return jsonify(error=f'Missing required fields: {", ".join(missing)}'), 400
    # Bug #11: validate play_date is not in the past
    try:
        play_date = datetime.strptime(data['play_date'], '%Y-%m-%d').date()
    except ValueError:
        return jsonify(error='Invalid play_date format. Use YYYY-MM-DD.'), 400
    if play_date < date.today():
        return jsonify(error='play_date must be today or in the future.'), 400
    p = LookingToPlay(
        user_id=uid,
        play_date=play_date,
        start_time=data['start_time'], end_time=data['end_time'],
        court=data.get('court', 'Flexible') or 'Flexible',
        match_type=data.get('match_type', 'singles'),
        level_min=float(data.get('level_min')) if data.get('level_min') else None,
        level_max=float(data.get('level_max')) if data.get('level_max') else None,
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
    data = request.get_json() or {}
    # Bug #12: validate day_of_week
    try:
        dow = int(data.get('day_of_week', -1))
    except (TypeError, ValueError):
        return jsonify(error='day_of_week must be an integer 0-6.'), 400
    if dow < 0 or dow > 6:
        return jsonify(error='day_of_week must be between 0 (Monday) and 6 (Sunday).'), 400
    if not data.get('start_time') or not data.get('end_time'):
        return jsonify(error='start_time and end_time are required.'), 400
    a = Availability(user_id=uid, day_of_week=dow,
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


def validate_structured_score(sets_data, match_format):
    """Validate structured score and return (score_string, winner_side, error)."""
    if not sets_data or not isinstance(sets_data, list):
        return None, None, 'Sets data required.'

    valid_formats = ('best_of_3', 'best_of_5', 'pro_set')
    if match_format not in valid_formats:
        return None, None, f'Invalid match format. Must be one of: {", ".join(valid_formats)}'

    if match_format == 'pro_set':
        if len(sets_data) != 1:
            return None, None, 'Pro set requires exactly 1 set.'
    elif match_format == 'best_of_3':
        if len(sets_data) < 2 or len(sets_data) > 3:
            return None, None, 'Best of 3 requires 2 or 3 sets.'
    elif match_format == 'best_of_5':
        if len(sets_data) < 3 or len(sets_data) > 5:
            return None, None, 'Best of 5 requires 3 to 5 sets.'

    p1_sets_won = 0
    p2_sets_won = 0
    score_parts = []

    for i, s in enumerate(sets_data):
        p1 = s.get('p1')
        p2 = s.get('p2')
        tb = s.get('tiebreak')

        if p1 is None or p2 is None:
            return None, None, f'Set {i+1}: scores required for both players.'
        if not isinstance(p1, int) or not isinstance(p2, int):
            return None, None, f'Set {i+1}: scores must be integers.'
        if p1 < 0 or p1 > 7 or p2 < 0 or p2 > 7:
            return None, None, f'Set {i+1}: scores must be 0-7.'

        # Validate set score logic
        if match_format == 'pro_set':
            # Pro set: first to 8, win by 2 (or tiebreak at 8-8 → 9-8)
            if p1 < 8 and p2 < 8:
                return None, None, 'Pro set: at least one player must reach 8 games.'
        else:
            # Normal set validation
            high, low = max(p1, p2), min(p1, p2)
            if high < 6:
                return None, None, f'Set {i+1}: at least one player must reach 6 games.'
            if high == 6 and low > 4 and low != 6:
                return None, None, f'Set {i+1}: invalid score.'
            if high == 7:
                if low not in (5, 6):
                    return None, None, f'Set {i+1}: 7 games only valid with 5 or 6 opponent games.'
                if low == 6 and tb is None:
                    return None, None, f'Set {i+1}: tiebreak score required for 7-6 sets.'
                if low == 6 and tb is not None:
                    if not isinstance(tb, dict) or 'p1' not in tb or 'p2' not in tb:
                        return None, None, f'Set {i+1}: tiebreak must have p1 and p2 scores.'
                    tb_p1, tb_p2 = tb['p1'], tb['p2']
                    if not isinstance(tb_p1, int) or not isinstance(tb_p2, int):
                        return None, None, f'Set {i+1}: tiebreak scores must be integers.'
                    tb_high, tb_low = max(tb_p1, tb_p2), min(tb_p1, tb_p2)
                    if tb_high < 7:
                        return None, None, f'Set {i+1}: tiebreak winner must reach at least 7.'
                    if tb_high - tb_low < 2 and tb_high < 7:
                        return None, None, f'Set {i+1}: tiebreak must be won by 2 points.'
                    # Check tiebreak winner matches set winner
                    if p1 == 7 and tb_p1 <= tb_p2:
                        return None, None, f'Set {i+1}: tiebreak winner must match set winner.'
                    if p2 == 7 and tb_p2 <= tb_p1:
                        return None, None, f'Set {i+1}: tiebreak winner must match set winner.'

        if p1 > p2:
            p1_sets_won += 1
        elif p2 > p1:
            p2_sets_won += 1
        else:
            return None, None, f'Set {i+1}: set cannot be a tie.'

        part = f'{p1}-{p2}'
        if tb is not None and p1 + p2 == 13:  # 7-6
            part += f'({min(tb["p1"], tb["p2"])})'
        score_parts.append(part)

    # Validate match winner
    if match_format == 'pro_set':
        winner_side = 'p1' if p1_sets_won > p2_sets_won else 'p2'
    elif match_format == 'best_of_3':
        sets_to_win = 2
        if p1_sets_won == sets_to_win:
            winner_side = 'p1'
        elif p2_sets_won == sets_to_win:
            winner_side = 'p2'
        else:
            return None, None, 'Match is incomplete: no player has won enough sets.'
        # Match should end when someone wins
        running_p1 = running_p2 = 0
        for i, s in enumerate(sets_data):
            if s['p1'] > s['p2']:
                running_p1 += 1
            else:
                running_p2 += 1
            if running_p1 == sets_to_win or running_p2 == sets_to_win:
                if i != len(sets_data) - 1:
                    return None, None, 'Too many sets: match already decided.'
    elif match_format == 'best_of_5':
        sets_to_win = 3
        if p1_sets_won == sets_to_win:
            winner_side = 'p1'
        elif p2_sets_won == sets_to_win:
            winner_side = 'p2'
        else:
            return None, None, 'Match is incomplete: no player has won enough sets.'
        running_p1 = running_p2 = 0
        for i, s in enumerate(sets_data):
            if s['p1'] > s['p2']:
                running_p1 += 1
            else:
                running_p2 += 1
            if running_p1 == sets_to_win or running_p2 == sets_to_win:
                if i != len(sets_data) - 1:
                    return None, None, 'Too many sets: match already decided.'

    score_string = ', '.join(score_parts)
    return score_string, winner_side, None


@app.route('/api/matches/<int:match_id>/score', methods=['POST'])
@jwt_required()
def submit_score(match_id):
    uid = int(get_jwt_identity())
    match = Match.query.get_or_404(match_id)
    if uid not in (match.player1_id, match.player2_id):
        return jsonify(error='Not authorized.'), 403
    # Bug #14: prevent score overwrite after confirmation
    if match.score_confirmed:
        return jsonify(error='Score already confirmed. Cannot resubmit.'), 400
    data = request.get_json()

    # Support both structured and legacy free-text submission
    if 'sets' in data:
        sets_data = data['sets']
        match_format = data.get('match_format', 'best_of_3')
        score_string, winner_side, error = validate_structured_score(sets_data, match_format)
        if error:
            return jsonify(error=error), 400
        match.sets = json.dumps(sets_data)
        match.match_format = match_format
        match.score = score_string
        # Auto-determine winner
        match.winner_id = match.player1_id if winner_side == 'p1' else match.player2_id
    else:
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
