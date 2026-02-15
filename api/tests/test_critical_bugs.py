"""Tests for critical bug fixes #5-#9."""
from tests.conftest import register_user, auth_header, create_match_between


# ── Bug #5: Self-invite blocked (400) ──

def test_self_invite_blocked(client):
    tok, uid = register_user(client, 'Alice', 'alice@test.com')
    from datetime import date, timedelta
    future = (date.today() + timedelta(days=7)).isoformat()
    resp = client.post('/api/invites', json={
        'to_user_id': uid, 'play_date': future,
        'start_time': '10:00', 'end_time': '12:00',
    }, headers=auth_header(tok))
    assert resp.status_code == 400
    assert 'yourself' in resp.get_json()['error'].lower()


# ── Bug #6: Self-match via accept blocked (400) ──

def test_self_match_via_accept_blocked(client):
    """Even if a self-invite somehow exists, accepting it should fail."""
    tok_a, id_a = register_user(client, 'Alice', 'alice@test.com')
    tok_b, id_b = register_user(client, 'Bob', 'bob@test.com')
    # Create a normal invite from B to A
    from datetime import date, timedelta
    future = (date.today() + timedelta(days=7)).isoformat()
    resp = client.post('/api/invites', json={
        'to_user_id': id_a, 'play_date': future,
        'start_time': '10:00', 'end_time': '12:00',
    }, headers=auth_header(tok_b))
    invite_id = resp.get_json()['invite']['id']
    # Manually tamper: set from_user_id == to_user_id in DB
    from models import db, MatchInvite
    with client.application.app_context():
        inv = db.session.get(MatchInvite, invite_id)
        inv.from_user_id = id_a  # now it's a self-invite
        db.session.commit()
    resp = client.post(f'/api/invites/{invite_id}/accept', headers=auth_header(tok_a))
    assert resp.status_code == 400
    assert 'self-invite' in resp.get_json()['error'].lower()


# ── Bug #7: Legacy score validation (reject invalid scores) ──

def test_legacy_score_rejects_invalid_characters(client):
    tok_a, id_a = register_user(client, 'Alice', 'alice@test.com')
    tok_b, id_b = register_user(client, 'Bob', 'bob@test.com')
    match_id = create_match_between(client, tok_a, id_a, tok_b, id_b)
    # Try submitting score with invalid chars
    resp = client.post(f'/api/matches/{match_id}/score', json={
        'score': '6-4; DROP TABLE', 'winner_id': id_a,
    }, headers=auth_header(tok_a))
    assert resp.status_code == 400
    assert 'invalid score format' in resp.get_json()['error'].lower()


def test_legacy_score_rejects_empty(client):
    tok_a, id_a = register_user(client, 'Alice', 'alice@test.com')
    tok_b, id_b = register_user(client, 'Bob', 'bob@test.com')
    match_id = create_match_between(client, tok_a, id_a, tok_b, id_b)
    resp = client.post(f'/api/matches/{match_id}/score', json={
        'score': '', 'winner_id': id_a,
    }, headers=auth_header(tok_a))
    assert resp.status_code == 400


# ── Bug #8: winner_id must be a match participant ──

def test_winner_must_be_participant(client):
    tok_a, id_a = register_user(client, 'Alice', 'alice@test.com')
    tok_b, id_b = register_user(client, 'Bob', 'bob@test.com')
    _, id_c = register_user(client, 'Charlie', 'charlie@test.com')
    match_id = create_match_between(client, tok_a, id_a, tok_b, id_b)
    resp = client.post(f'/api/matches/{match_id}/score', json={
        'score': '6-4, 6-3', 'winner_id': id_c,
    }, headers=auth_header(tok_a))
    assert resp.status_code == 400
    assert 'participant' in resp.get_json()['error'].lower()


# ── Bug #9: Only match participants can confirm scores (403) ──

def test_only_participants_can_confirm(client):
    tok_a, id_a = register_user(client, 'Alice', 'alice@test.com')
    tok_b, id_b = register_user(client, 'Bob', 'bob@test.com')
    tok_c, id_c = register_user(client, 'Charlie', 'charlie@test.com')
    match_id = create_match_between(client, tok_a, id_a, tok_b, id_b)
    # Submit score
    client.post(f'/api/matches/{match_id}/score', json={
        'score': '6-4, 6-3', 'winner_id': id_a,
    }, headers=auth_header(tok_a))
    # Charlie (non-participant) tries to confirm
    resp = client.post(f'/api/matches/{match_id}/confirm', json={
        'action': 'confirm',
    }, headers=auth_header(tok_c))
    assert resp.status_code == 403
    assert 'not authorized' in resp.get_json()['error'].lower()


def test_participant_can_confirm(client):
    tok_a, id_a = register_user(client, 'Alice', 'alice@test.com')
    tok_b, id_b = register_user(client, 'Bob', 'bob@test.com')
    match_id = create_match_between(client, tok_a, id_a, tok_b, id_b)
    client.post(f'/api/matches/{match_id}/score', json={
        'score': '6-4, 6-3', 'winner_id': id_a,
    }, headers=auth_header(tok_a))
    # Bob (opponent) confirms
    resp = client.post(f'/api/matches/{match_id}/confirm', json={
        'action': 'confirm',
    }, headers=auth_header(tok_b))
    assert resp.status_code == 200
    assert resp.get_json()['match']['score_confirmed'] is True
