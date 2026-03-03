"""Tests for email verification flow."""
import pytest
from unittest.mock import patch
from tests.conftest import register_user, auth_header


class TestEmailVerification:

    def test_register_sends_verification(self, client):
        """Registration with email should return email_verification_sent=True."""
        resp = client.post('/api/auth/register', json={
            'name': 'Test', 'email': 'test@example.com', 'password': 'pass1234',
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['email_verification_sent'] is True
        assert data['user']['email_verified'] is False

    def test_register_no_email_is_verified(self, client):
        """Registration with phone only should be auto-verified."""
        resp = client.post('/api/auth/register', json={
            'name': 'Test', 'phone': '1234567890', 'password': 'pass1234',
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['user']['email_verified'] is True

    def test_verify_email_with_valid_token(self, client):
        """Verify email with correct token."""
        resp = client.post('/api/auth/register', json={
            'name': 'Test', 'email': 'test@example.com', 'password': 'pass1234',
        })
        token = resp.get_json()['token']

        # Get the verification token from the user
        from models import User
        user = User.query.filter_by(email='test@example.com').first()
        v_token = user.verification_token
        assert v_token is not None

        resp = client.post('/api/auth/verify-email', json={'token': v_token})
        assert resp.status_code == 200
        assert resp.get_json()['user']['email_verified'] is True

    def test_verify_email_invalid_token(self, client):
        resp = client.post('/api/auth/verify-email', json={'token': 'bogus'})
        assert resp.status_code == 400
        assert 'Invalid' in resp.get_json()['error']

    def test_verify_email_empty_token(self, client):
        resp = client.post('/api/auth/verify-email', json={'token': ''})
        assert resp.status_code == 400

    def test_verify_email_already_verified(self, client):
        resp = client.post('/api/auth/register', json={
            'name': 'Test', 'email': 'test@example.com', 'password': 'pass1234',
        })
        from models import User
        user = User.query.filter_by(email='test@example.com').first()
        v_token = user.verification_token

        # Verify once
        client.post('/api/auth/verify-email', json={'token': v_token})

        # Token is cleared after verification, so this should fail
        resp = client.post('/api/auth/verify-email', json={'token': v_token})
        assert resp.status_code == 400

    def test_unverified_user_cannot_create_post(self, client):
        """Unverified users get 403 on protected endpoints."""
        token, uid = register_user(client, 'Test', 'test@example.com', verified=False)
        from datetime import date, timedelta
        future = (date.today() + timedelta(days=3)).isoformat()
        resp = client.post('/api/posts', json={
            'play_date': future, 'start_time': '10:00', 'end_time': '12:00',
        }, headers=auth_header(token))
        assert resp.status_code == 403
        assert 'verify your email' in resp.get_json()['error'].lower()

    def test_verified_user_can_create_post(self, client):
        """Verified users can create posts."""
        token, uid = register_user(client, 'Test', 'test@example.com', verified=True)

        from datetime import date, timedelta
        future = (date.today() + timedelta(days=3)).isoformat()
        resp = client.post('/api/posts', json={
            'play_date': future, 'start_time': '10:00', 'end_time': '12:00',
        }, headers=auth_header(token))
        assert resp.status_code == 201

    def test_unverified_can_login(self, client):
        """Unverified users can still log in."""
        client.post('/api/auth/register', json={
            'name': 'Test', 'email': 'test@example.com', 'password': 'pass1234',
        })
        resp = client.post('/api/auth/login', json={
            'identifier': 'test@example.com', 'password': 'pass1234',
        })
        assert resp.status_code == 200
        assert resp.get_json()['user']['email_verified'] is False

    def test_resend_verification(self, client):
        """Resend verification email."""
        resp = client.post('/api/auth/register', json={
            'name': 'Test', 'email': 'test@example.com', 'password': 'pass1234',
        })
        token = resp.get_json()['token']

        # Need to wait past cooldown or mock it — clear rate limit state
        import email_verification
        email_verification._email_sends.clear()
        email_verification._ip_sends.clear()

        resp = client.post('/api/auth/resend-verification', headers=auth_header(token))
        assert resp.status_code == 200
        assert 'sent' in resp.get_json()['message'].lower()

    def test_resend_already_verified(self, client):
        """Can't resend if already verified."""
        resp = client.post('/api/auth/register', json={
            'name': 'Test', 'email': 'test@example.com', 'password': 'pass1234',
        })
        token = resp.get_json()['token']
        from models import User, db
        user = User.query.filter_by(email='test@example.com').first()
        user.email_verified = True
        db.session.commit()

        resp = client.post('/api/auth/resend-verification', headers=auth_header(token))
        assert resp.status_code == 400

    def test_expired_token(self, client):
        """Expired token should fail verification."""
        client.post('/api/auth/register', json={
            'name': 'Test', 'email': 'test@example.com', 'password': 'pass1234',
        })
        from models import User, db
        from datetime import datetime, timedelta
        user = User.query.filter_by(email='test@example.com').first()
        v_token = user.verification_token
        # Set sent_at to 25 hours ago
        user.verification_sent_at = datetime.utcnow() - timedelta(hours=25)
        db.session.commit()

        resp = client.post('/api/auth/verify-email', json={'token': v_token})
        assert resp.status_code == 400
        assert 'expired' in resp.get_json()['error'].lower()
