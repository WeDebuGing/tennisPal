"""Integration tests for registration, login, and auth protection flows."""
from tests.conftest import register_user, auth_header


# ═══════════════════════════════════════════════════════════
# Registration  (POST /api/auth/register)
# ═══════════════════════════════════════════════════════════


class TestRegistration:
    def test_register_with_all_fields(self, client):
        resp = client.post('/api/auth/register', json={
            'name': 'Alice', 'email': 'alice@test.com',
            'phone': '1234567890', 'password': 'pass1234', 'ntrp': 4.0,
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert 'token' in data
        assert data['user']['name'] == 'Alice'
        assert data['user']['email'] == 'alice@test.com'
        assert data['user']['ntrp'] == 4.0

    def test_register_with_null_ntrp(self, client):
        resp = client.post('/api/auth/register', json={
            'name': 'Bob', 'email': 'bob@test.com',
            'password': 'pass1234', 'ntrp': None,
        })
        assert resp.status_code == 201
        assert resp.get_json()['user']['ntrp'] is None

    def test_register_duplicate_email_409(self, client):
        client.post('/api/auth/register', json={
            'name': 'Alice', 'email': 'alice@test.com', 'password': 'pass1234',
        })
        resp = client.post('/api/auth/register', json={
            'name': 'Alice2', 'email': 'alice@test.com', 'password': 'pass1234',
        })
        assert resp.status_code == 409
        assert 'email' in resp.get_json()['error'].lower()

    def test_register_duplicate_phone_409(self, client):
        client.post('/api/auth/register', json={
            'name': 'Alice', 'phone': '5551234567', 'password': 'pass1234',
        })
        resp = client.post('/api/auth/register', json={
            'name': 'Alice2', 'phone': '5551234567', 'password': 'pass1234',
        })
        assert resp.status_code == 409
        assert 'phone' in resp.get_json()['error'].lower()

    def test_register_missing_name(self, client):
        resp = client.post('/api/auth/register', json={
            'email': 'x@test.com', 'password': 'pass1234',
        })
        assert resp.status_code == 400

    def test_register_missing_password(self, client):
        resp = client.post('/api/auth/register', json={
            'name': 'NoPass', 'email': 'nopass@test.com',
        })
        assert resp.status_code == 400

    def test_register_missing_email_and_phone(self, client):
        resp = client.post('/api/auth/register', json={
            'name': 'NoContact', 'password': 'pass1234',
        })
        assert resp.status_code == 400

    def test_register_returns_valid_jwt(self, client):
        """Token from registration should work on protected endpoints."""
        resp = client.post('/api/auth/register', json={
            'name': 'Alice', 'email': 'alice@test.com', 'password': 'pass1234',
        })
        token = resp.get_json()['token']
        me = client.get('/api/auth/me', headers=auth_header(token))
        assert me.status_code == 200
        assert me.get_json()['user']['name'] == 'Alice'


# ═══════════════════════════════════════════════════════════
# Login  (POST /api/auth/login)
# ═══════════════════════════════════════════════════════════


class TestLogin:
    def test_login_success(self, client):
        register_user(client, 'Alice', 'alice@test.com', password='secret123')
        resp = client.post('/api/auth/login', json={
            'identifier': 'alice@test.com', 'password': 'secret123',
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'token' in data
        assert data['user']['email'] == 'alice@test.com'

    def test_login_wrong_password(self, client):
        register_user(client, 'Alice', 'alice@test.com', password='secret123')
        resp = client.post('/api/auth/login', json={
            'identifier': 'alice@test.com', 'password': 'wrong',
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post('/api/auth/login', json={
            'identifier': 'nobody@test.com', 'password': 'whatever',
        })
        assert resp.status_code == 401

    def test_login_missing_identifier(self, client):
        resp = client.post('/api/auth/login', json={'password': 'x'})
        # Should not crash; returns 401 since no user matches empty string
        assert resp.status_code == 401

    def test_login_missing_password(self, client):
        register_user(client, 'Alice', 'alice@test.com', password='secret123')
        resp = client.post('/api/auth/login', json={
            'identifier': 'alice@test.com',
        })
        assert resp.status_code == 401

    def test_login_returns_valid_jwt(self, client):
        register_user(client, 'Alice', 'alice@test.com', password='secret123')
        resp = client.post('/api/auth/login', json={
            'identifier': 'alice@test.com', 'password': 'secret123',
        })
        token = resp.get_json()['token']
        me = client.get('/api/auth/me', headers=auth_header(token))
        assert me.status_code == 200


# ═══════════════════════════════════════════════════════════
# Auth protection  (GET /api/auth/me)
# ═══════════════════════════════════════════════════════════


class TestAuthProtection:
    def test_protected_endpoint_without_token(self, client):
        resp = client.get('/api/auth/me')
        assert resp.status_code == 401

    def test_protected_endpoint_with_invalid_token(self, client):
        resp = client.get('/api/auth/me', headers=auth_header('garbage.token.here'))
        assert resp.status_code == 422  # JWT decode error

    def test_protected_endpoint_with_valid_token(self, client):
        token, _ = register_user(client, 'Alice', 'alice@test.com')
        resp = client.get('/api/auth/me', headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.get_json()['user']['name'] == 'Alice'
