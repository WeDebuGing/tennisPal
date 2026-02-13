import pytest
import sys
import os

# Ensure api/ is on the path so `from models import ...` works inside app.py
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app import app as flask_app
from models import db as _db


@pytest.fixture()
def app():
    flask_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': 'sqlite://',  # in-memory
    })
    with flask_app.app_context():
        _db.create_all()
        yield flask_app
        _db.session.remove()
        _db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


def register_user(client, name, email, password='pass1234', ntrp=4.0):
    resp = client.post('/api/auth/register', json={
        'name': name, 'email': email, 'password': password, 'ntrp': ntrp,
    })
    data = resp.get_json()
    return data.get('token'), data.get('user', {}).get('id')


def auth_header(token):
    return {'Authorization': f'Bearer {token}'}


def create_match_between(client, token_a, id_a, token_b, id_b):
    """Create a match by having user A invite user B, and B accepts."""
    from datetime import date, timedelta
    future = (date.today() + timedelta(days=7)).isoformat()
    resp = client.post('/api/invites', json={
        'to_user_id': id_b, 'play_date': future,
        'start_time': '10:00', 'end_time': '12:00',
    }, headers=auth_header(token_a))
    invite_id = resp.get_json()['invite']['id']
    resp = client.post(f'/api/invites/{invite_id}/accept', headers=auth_header(token_b))
    return resp.get_json()['match']['id']
