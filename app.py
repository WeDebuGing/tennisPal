from flask import Flask, render_template, request, redirect, url_for, flash
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Availability, LookingToPlay, MatchInvite, Match, Notification
from datetime import datetime, date, timedelta
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-prod')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tennispal.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


@app.context_processor
def inject_globals():
    notif_count = 0
    if current_user.is_authenticated:
        notif_count = Notification.query.filter_by(user_id=current_user.id, read=False).count()
    return dict(notif_count=notif_count, DAY_NAMES=DAY_NAMES)


# ── Auth ──

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name'].strip()
        email = request.form.get('email', '').strip() or None
        phone = request.form.get('phone', '').strip() or None
        password = request.form['password']
        ntrp = request.form.get('ntrp', '').strip()
        ntrp = float(ntrp) if ntrp else None

        if not email and not phone:
            flash('Provide email or phone.', 'error')
            return redirect(url_for('register'))
        if email and User.query.filter_by(email=email).first():
            flash('Email already registered.', 'error')
            return redirect(url_for('register'))
        if phone and User.query.filter_by(phone=phone).first():
            flash('Phone already registered.', 'error')
            return redirect(url_for('register'))

        user = User(name=name, email=email, phone=phone,
                     password_hash=generate_password_hash(password), ntrp=ntrp)
        db.session.add(user)
        db.session.commit()
        login_user(user)
        flash('Welcome to TennisPal!', 'success')
        return redirect(url_for('index'))
    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        identifier = request.form['identifier'].strip()
        password = request.form['password']
        user = User.query.filter((User.email == identifier) | (User.phone == identifier)).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return redirect(url_for('index'))
        flash('Invalid credentials.', 'error')
    return render_template('login.html')


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('login'))


# ── Feed ──

@app.route('/')
def index():
    posts = LookingToPlay.query.filter(
        LookingToPlay.claimed_by_id.is_(None),
        LookingToPlay.play_date >= date.today()
    ).order_by(LookingToPlay.play_date, LookingToPlay.start_time).all()
    # Filter expired
    posts = [p for p in posts if p.is_active]
    return render_template('index.html', posts=posts)


@app.route('/claim/<int:post_id>', methods=['POST'])
@login_required
def claim_post(post_id):
    post = LookingToPlay.query.get_or_404(post_id)
    if post.user_id == current_user.id:
        flash("Can't claim your own post.", 'error')
        return redirect(url_for('index'))
    if not post.is_active:
        flash('Post no longer available.', 'error')
        return redirect(url_for('index'))
    post.claimed_by_id = current_user.id
    # Create match
    match = Match(player1_id=post.user_id, player2_id=current_user.id,
                  play_date=post.play_date, match_type=post.match_type)
    db.session.add(match)
    # Notify poster
    n = Notification(user_id=post.user_id,
                     message=f"{current_user.name} claimed your post for {post.play_date.strftime('%b %d')}!",
                     link=url_for('match_detail', match_id=match.id))
    db.session.add(n)
    db.session.commit()
    flash("You're in! Match created.", 'success')
    return redirect(url_for('matches'))


# ── Post ──

@app.route('/post', methods=['GET', 'POST'])
@login_required
def create_post():
    if request.method == 'POST':
        p = LookingToPlay(
            user_id=current_user.id,
            play_date=datetime.strptime(request.form['play_date'], '%Y-%m-%d').date(),
            start_time=request.form['start_time'],
            end_time=request.form['end_time'],
            court=request.form.get('court', 'Flexible') or 'Flexible',
            match_type=request.form.get('match_type', 'singles'),
            level_min=float(request.form['level_min']) if request.form.get('level_min') else None,
            level_max=float(request.form['level_max']) if request.form.get('level_max') else None,
        )
        db.session.add(p)
        db.session.commit()
        flash('Post created!', 'success')
        return redirect(url_for('index'))
    return render_template('post.html', today=date.today().isoformat())


# ── Players ──

@app.route('/players')
def players():
    q = request.args
    day = q.get('day', '')
    users = User.query.order_by(User.name).all()
    if day:
        day_int = int(day)
        user_ids = {a.user_id for a in Availability.query.filter_by(day_of_week=day_int).all()}
        users = [u for u in users if u.id in user_ids]
    return render_template('players.html', players=users, selected_day=day)


@app.route('/player/<int:user_id>')
def player_profile(user_id):
    user = User.query.get_or_404(user_id)
    match_history = Match.query.filter(
        (Match.player1_id == user_id) | (Match.player2_id == user_id)
    ).order_by(Match.play_date.desc()).all()
    # H2H with current user
    h2h = None
    if current_user.is_authenticated and current_user.id != user_id:
        h2h_matches = Match.query.filter(Match.score_confirmed == True).filter(
            ((Match.player1_id == current_user.id) & (Match.player2_id == user_id)) |
            ((Match.player1_id == user_id) & (Match.player2_id == current_user.id))
        ).all()
        w = sum(1 for m in h2h_matches if m.winner_id == current_user.id)
        l = sum(1 for m in h2h_matches if m.winner_id == user_id)
        h2h = {'wins': w, 'losses': l, 'matches': h2h_matches}
    return render_template('player.html', player=user, match_history=match_history, h2h=h2h)


# ── Availability ──

@app.route('/availability', methods=['GET', 'POST'])
@login_required
def availability():
    if request.method == 'POST':
        day = int(request.form['day_of_week'])
        start = request.form['start_time']
        end = request.form['end_time']
        a = Availability(user_id=current_user.id, day_of_week=day, start_time=start, end_time=end)
        db.session.add(a)
        db.session.commit()
        flash('Availability added!', 'success')
        return redirect(url_for('availability'))
    slots = Availability.query.filter_by(user_id=current_user.id).order_by(Availability.day_of_week).all()
    return render_template('availability.html', slots=slots)


@app.route('/availability/delete/<int:slot_id>', methods=['POST'])
@login_required
def delete_availability(slot_id):
    a = Availability.query.get_or_404(slot_id)
    if a.user_id != current_user.id:
        flash('Not authorized.', 'error')
        return redirect(url_for('availability'))
    db.session.delete(a)
    db.session.commit()
    flash('Removed.', 'success')
    return redirect(url_for('availability'))


# ── Invites ──

@app.route('/invite/<int:to_user_id>', methods=['GET', 'POST'])
@login_required
def send_invite(to_user_id):
    to_user = User.query.get_or_404(to_user_id)
    if request.method == 'POST':
        inv = MatchInvite(
            from_user_id=current_user.id, to_user_id=to_user_id,
            play_date=datetime.strptime(request.form['play_date'], '%Y-%m-%d').date(),
            start_time=request.form['start_time'],
            end_time=request.form['end_time'],
            court=request.form.get('court', 'TBD'),
            match_type=request.form.get('match_type', 'singles'),
        )
        db.session.add(inv)
        n = Notification(user_id=to_user_id,
                         message=f"{current_user.name} invited you to play on {inv.play_date.strftime('%b %d')}!")
        db.session.add(n)
        db.session.commit()
        flash('Invite sent!', 'success')
        return redirect(url_for('player_profile', user_id=to_user_id))
    return render_template('invite.html', to_user=to_user, today=date.today().isoformat())


@app.route('/invite/<int:invite_id>/respond', methods=['POST'])
@login_required
def respond_invite(invite_id):
    inv = MatchInvite.query.get_or_404(invite_id)
    if inv.to_user_id != current_user.id:
        flash('Not authorized.', 'error')
        return redirect(url_for('matches'))
    action = request.form['action']
    if action == 'accept':
        inv.status = 'accepted'
        match = Match(player1_id=inv.from_user_id, player2_id=inv.to_user_id,
                      play_date=inv.play_date, match_type=inv.match_type)
        db.session.add(match)
        n = Notification(user_id=inv.from_user_id,
                         message=f"{current_user.name} accepted your invite for {inv.play_date.strftime('%b %d')}!")
        db.session.add(n)
    else:
        inv.status = 'declined'
        n = Notification(user_id=inv.from_user_id,
                         message=f"{current_user.name} declined your invite.")
        db.session.add(n)
    db.session.commit()
    flash(f'Invite {inv.status}.', 'success')
    return redirect(url_for('matches'))


# ── Matches ──

@app.route('/matches')
@login_required
def matches():
    my_matches = Match.query.filter(
        (Match.player1_id == current_user.id) | (Match.player2_id == current_user.id)
    ).order_by(Match.play_date.desc()).all()
    pending_invites = MatchInvite.query.filter_by(to_user_id=current_user.id, status='pending').all()
    sent_invites = MatchInvite.query.filter_by(from_user_id=current_user.id, status='pending').all()
    return render_template('matches.html', matches=my_matches, pending_invites=pending_invites, sent_invites=sent_invites)


@app.route('/match/<int:match_id>')
@login_required
def match_detail(match_id):
    match = Match.query.get_or_404(match_id)
    if current_user.id not in (match.player1_id, match.player2_id):
        flash('Not authorized.', 'error')
        return redirect(url_for('matches'))
    return render_template('match.html', match=match)


@app.route('/match/<int:match_id>/score', methods=['POST'])
@login_required
def submit_score(match_id):
    match = Match.query.get_or_404(match_id)
    if current_user.id not in (match.player1_id, match.player2_id):
        flash('Not authorized.', 'error')
        return redirect(url_for('matches'))
    match.score = request.form['score'].strip()
    match.winner_id = int(request.form['winner_id'])
    match.score_submitted_by = current_user.id
    match.status = 'completed'
    match.score_confirmed = False
    match.score_disputed = False
    # Notify opponent
    opp_id = match.player2_id if match.player1_id == current_user.id else match.player1_id
    n = Notification(user_id=opp_id,
                     message=f"{current_user.name} submitted a score: {match.score}. Please confirm.",
                     link=url_for('match_detail', match_id=match.id))
    db.session.add(n)
    db.session.commit()
    flash('Score submitted!', 'success')
    return redirect(url_for('match_detail', match_id=match.id))


@app.route('/match/<int:match_id>/confirm', methods=['POST'])
@login_required
def confirm_score(match_id):
    match = Match.query.get_or_404(match_id)
    if current_user.id == match.score_submitted_by:
        flash("You can't confirm your own score.", 'error')
        return redirect(url_for('match_detail', match_id=match.id))
    action = request.form['action']
    if action == 'confirm':
        match.score_confirmed = True
        flash('Score confirmed!', 'success')
    else:
        match.score_disputed = True
        flash('Score disputed.', 'error')
    db.session.commit()
    return redirect(url_for('match_detail', match_id=match.id))


@app.route('/match/<int:match_id>/cancel', methods=['POST'])
@login_required
def cancel_match(match_id):
    match = Match.query.get_or_404(match_id)
    if current_user.id not in (match.player1_id, match.player2_id):
        flash('Not authorized.', 'error')
        return redirect(url_for('matches'))
    match.status = 'cancelled'
    db.session.commit()
    flash('Match cancelled.', 'info')
    return redirect(url_for('matches'))


# ── Leaderboard ──

@app.route('/leaderboard')
def leaderboard():
    users = User.query.all()
    board = sorted(users, key=lambda u: u.wins, reverse=True)
    return render_template('leaderboard.html', players=board)


# ── Notifications ──

@app.route('/notifications')
@login_required
def notifications():
    notes = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.created_at.desc()).limit(50).all()
    Notification.query.filter_by(user_id=current_user.id, read=False).update({'read': True})
    db.session.commit()
    return render_template('notifications.html', notifications=notes)


# ── Profile ──

@app.route('/profile')
@login_required
def profile():
    return redirect(url_for('player_profile', user_id=current_user.id))


# ── Init ──

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5001)
