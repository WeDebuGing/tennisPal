"""Tests for medium bug fixes #10-#14."""
from tests.conftest import register_user, auth_header, create_match_between
from datetime import date, timedelta


# ── Bug #10: Missing post fields → 400 (not 500) ──

def test_create_post_missing_fields(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    resp = client.post('/api/posts', json={}, headers=auth_header(tok))
    assert resp.status_code == 400
    assert 'missing' in resp.get_json()['error'].lower()


def test_create_post_partial_fields(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    resp = client.post('/api/posts', json={
        'play_date': (date.today() + timedelta(days=1)).isoformat(),
    }, headers=auth_header(tok))
    assert resp.status_code == 400
    assert 'start_time' in resp.get_json()['error'] or 'end_time' in resp.get_json()['error']


# ── Bug #11: Posts with past dates → 400 ──

def test_create_post_past_date(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    past = (date.today() - timedelta(days=5)).isoformat()
    resp = client.post('/api/posts', json={
        'play_date': past, 'start_time': '10:00', 'end_time': '12:00',
    }, headers=auth_header(tok))
    assert resp.status_code == 400
    assert 'future' in resp.get_json()['error'].lower() or 'past' in resp.get_json()['error'].lower()


def test_create_post_today_ok(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    resp = client.post('/api/posts', json={
        'play_date': date.today().isoformat(),
        'start_time': '23:59', 'end_time': '23:59',
    }, headers=auth_header(tok))
    assert resp.status_code == 201


# ── Bug #12: Invalid day_of_week → 400 ──

def test_availability_invalid_day(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    resp = client.post('/api/availability', json={
        'day_of_week': 9, 'start_time': '10:00', 'end_time': '12:00',
    }, headers=auth_header(tok))
    assert resp.status_code == 400
    assert 'day_of_week' in resp.get_json()['error']


def test_availability_negative_day(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    resp = client.post('/api/availability', json={
        'day_of_week': -1, 'start_time': '10:00', 'end_time': '12:00',
    }, headers=auth_header(tok))
    assert resp.status_code == 400


def test_availability_string_day(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    resp = client.post('/api/availability', json={
        'day_of_week': 'Monday', 'start_time': '10:00', 'end_time': '12:00',
    }, headers=auth_header(tok))
    assert resp.status_code == 400


def test_availability_valid_day(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    resp = client.post('/api/availability', json={
        'day_of_week': 3, 'start_time': '10:00', 'end_time': '12:00',
    }, headers=auth_header(tok))
    assert resp.status_code == 201


# ── Bug #13: Profile update endpoint works (PUT /api/profile) ──

def test_profile_update(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    resp = client.put('/api/profile', json={
        'name': 'Alice Updated', 'ntrp': 4.5, 'city': 'New York',
    }, headers=auth_header(tok))
    assert resp.status_code == 200
    assert resp.get_json()['user']['name'] == 'Alice Updated'
    assert resp.get_json()['user']['ntrp'] == 4.5


def test_profile_update_empty_name_rejected(client):
    tok, _ = register_user(client, 'Alice', 'alice@test.com')
    resp = client.put('/api/profile', json={'name': ''}, headers=auth_header(tok))
    assert resp.status_code == 400


def test_profile_update_duplicate_phone(client):
    tok_a, _ = register_user(client, 'Alice', 'alice@test.com')
    # Register Dave with a phone number
    client.post('/api/auth/register', json={
        'name': 'Dave', 'phone': '5551234', 'password': 'pass1234',
    })
    # Alice tries to use Dave's phone
    resp = client.put('/api/profile', json={'phone': '5551234'}, headers=auth_header(tok_a))
    assert resp.status_code == 409


# ── Bug #14: Score overwrite after confirm blocked (400) ──

def test_score_overwrite_after_confirm_blocked(client):
    tok_a, id_a = register_user(client, 'Alice', 'alice@test.com')
    tok_b, id_b = register_user(client, 'Bob', 'bob@test.com')
    match_id = create_match_between(client, tok_a, id_a, tok_b, id_b)
    # Submit and confirm score
    client.post(f'/api/matches/{match_id}/score', json={
        'score': '6-4, 6-3', 'winner_id': id_a,
    }, headers=auth_header(tok_a))
    client.post(f'/api/matches/{match_id}/confirm', json={
        'action': 'confirm',
    }, headers=auth_header(tok_b))
    # Try to overwrite
    resp = client.post(f'/api/matches/{match_id}/score', json={
        'score': '0-6, 0-6', 'winner_id': id_b,
    }, headers=auth_header(tok_a))
    assert resp.status_code == 400
    assert 'already confirmed' in resp.get_json()['error'].lower()
