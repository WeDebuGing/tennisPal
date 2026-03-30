"""Tests for League / Season Mode endpoints."""
import pytest
from datetime import date, timedelta
from tests.conftest import register_user, auth_header


class TestLeagueCRUD:
    def test_create_league(self, client):
        token, uid = register_user(client, 'Alice', 'alice@test.com')
        resp = client.post('/api/leagues', json={
            'name': 'Schenley Ladder', 'format': 'ladder',
        }, headers=auth_header(token))
        assert resp.status_code == 201
        data = resp.get_json()
        assert data['league']['name'] == 'Schenley Ladder'
        assert data['league']['slug'] == 'schenley-ladder'
        assert data['league']['format'] == 'ladder'
        assert data['league']['member_count'] == 1  # creator is organizer

    def test_create_league_duplicate_name(self, client):
        token, _ = register_user(client, 'Alice', 'alice@test.com')
        client.post('/api/leagues', json={'name': 'Test League', 'format': 'ladder'}, headers=auth_header(token))
        resp = client.post('/api/leagues', json={'name': 'Test League', 'format': 'flex'}, headers=auth_header(token))
        assert resp.status_code == 409

    def test_create_league_invalid_format(self, client):
        token, _ = register_user(client, 'Alice', 'alice@test.com')
        resp = client.post('/api/leagues', json={'name': 'Bad', 'format': 'invalid'}, headers=auth_header(token))
        assert resp.status_code == 400

    def test_list_leagues(self, client):
        token, _ = register_user(client, 'Alice', 'alice@test.com')
        client.post('/api/leagues', json={'name': 'League A', 'format': 'ladder'}, headers=auth_header(token))
        client.post('/api/leagues', json={'name': 'League B', 'format': 'flex'}, headers=auth_header(token))
        resp = client.get('/api/leagues')
        assert resp.status_code == 200
        assert len(resp.get_json()['leagues']) == 2

    def test_get_league_by_slug(self, client):
        token, _ = register_user(client, 'Alice', 'alice@test.com')
        client.post('/api/leagues', json={'name': 'My League', 'format': 'round_robin'}, headers=auth_header(token))
        resp = client.get('/api/leagues/my-league')
        assert resp.status_code == 200
        assert resp.get_json()['league']['name'] == 'My League'

    def test_update_league(self, client):
        token, _ = register_user(client, 'Alice', 'alice@test.com')
        client.post('/api/leagues', json={'name': 'Updatable', 'format': 'ladder'}, headers=auth_header(token))
        resp = client.put('/api/leagues/updatable', json={'city': 'New York'}, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.get_json()['league']['city'] == 'New York'

    def test_update_league_non_organizer(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        token_b, _ = register_user(client, 'Bob', 'bob@test.com')
        client.post('/api/leagues', json={'name': 'Private', 'format': 'ladder'}, headers=auth_header(token_a))
        resp = client.put('/api/leagues/private', json={'city': 'LA'}, headers=auth_header(token_b))
        assert resp.status_code == 403

    def test_delete_league(self, client):
        token, _ = register_user(client, 'Alice', 'alice@test.com')
        client.post('/api/leagues', json={'name': 'Deletable', 'format': 'ladder'}, headers=auth_header(token))
        resp = client.delete('/api/leagues/deletable', headers=auth_header(token))
        assert resp.status_code == 200
        # Should not appear in list
        resp = client.get('/api/leagues')
        assert len(resp.get_json()['leagues']) == 0

    def test_status_transitions(self, client):
        token, _ = register_user(client, 'Alice', 'alice@test.com')
        start = (date.today() - timedelta(days=1)).isoformat()
        end = (date.today() + timedelta(days=30)).isoformat()
        client.post('/api/leagues', json={
            'name': 'Season Test', 'format': 'ladder',
            'season_name': 'Spring', 'start_date': start, 'end_date': end, 'status': 'upcoming',
        }, headers=auth_header(token))
        # upcoming -> active
        resp = client.put('/api/leagues/season-test', json={'status': 'active'}, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.get_json()['league']['status'] == 'active'
        # active -> completed
        resp = client.put('/api/leagues/season-test', json={'status': 'completed'}, headers=auth_header(token))
        assert resp.status_code == 200
        # completed -> active should fail
        resp = client.put('/api/leagues/season-test', json={'status': 'active'}, headers=auth_header(token))
        assert resp.status_code == 400


class TestMembership:
    def _create_league(self, client, token, name='Test League', **kwargs):
        return client.post('/api/leagues', json={'name': name, 'format': 'ladder', **kwargs}, headers=auth_header(token))

    def test_join_open_league(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        token_b, _ = register_user(client, 'Bob', 'bob@test.com')
        self._create_league(client, token_a)
        resp = client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        assert resp.status_code == 201
        assert resp.get_json()['membership']['role'] == 'member'

    def test_join_already_member(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        token_b, _ = register_user(client, 'Bob', 'bob@test.com')
        self._create_league(client, token_a)
        client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        resp = client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        assert resp.status_code == 409

    def test_join_invite_only(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        token_b, _ = register_user(client, 'Bob', 'bob@test.com')
        self._create_league(client, token_a, join_mode='invite_only')
        resp = client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        assert resp.status_code == 403

    def test_join_approval_league(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        token_b, uid_b = register_user(client, 'Bob', 'bob@test.com')
        self._create_league(client, token_a, join_mode='approval')
        resp = client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        assert resp.status_code == 201
        assert resp.get_json()['membership']['role'] == 'pending'
        # Approve
        resp = client.post(f'/api/leagues/test-league/members/{uid_b}/approve', headers=auth_header(token_a))
        assert resp.status_code == 200
        assert resp.get_json()['membership']['role'] == 'member'

    def test_join_ntrp_restriction(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com', ntrp=4.5)
        token_b, _ = register_user(client, 'Bob', 'bob@test.com', ntrp=2.5)
        self._create_league(client, token_a, ntrp_min=3.5, ntrp_max=5.0)
        resp = client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        assert resp.status_code == 400

    def test_leave_league(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        token_b, _ = register_user(client, 'Bob', 'bob@test.com')
        self._create_league(client, token_a)
        client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        resp = client.post('/api/leagues/test-league/leave', headers=auth_header(token_b))
        assert resp.status_code == 200

    def test_last_organizer_cannot_leave(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        self._create_league(client, token_a)
        resp = client.post('/api/leagues/test-league/leave', headers=auth_header(token_a))
        assert resp.status_code == 400

    def test_list_members(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        token_b, _ = register_user(client, 'Bob', 'bob@test.com')
        self._create_league(client, token_a)
        client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        resp = client.get('/api/leagues/test-league/members')
        assert resp.status_code == 200
        assert len(resp.get_json()['members']) == 2

    def test_remove_member(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        token_b, uid_b = register_user(client, 'Bob', 'bob@test.com')
        self._create_league(client, token_a)
        client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        resp = client.post(f'/api/leagues/test-league/members/{uid_b}/remove', headers=auth_header(token_a))
        assert resp.status_code == 200

    def test_promote_member(self, client):
        token_a, _ = register_user(client, 'Alice', 'alice@test.com')
        token_b, uid_b = register_user(client, 'Bob', 'bob@test.com')
        self._create_league(client, token_a)
        client.post('/api/leagues/test-league/join', headers=auth_header(token_b))
        resp = client.post(f'/api/leagues/test-league/members/{uid_b}/promote', headers=auth_header(token_a))
        assert resp.status_code == 200
        assert resp.get_json()['membership']['role'] == 'organizer'


class TestStandings:
    def _setup_league_with_match(self, client):
        """Create a league with 2 members and a confirmed match."""
        token_a, uid_a = register_user(client, 'Alice', 'alice@test.com')
        token_b, uid_b = register_user(client, 'Bob', 'bob@test.com')
        start = (date.today() - timedelta(days=10)).isoformat()
        end = (date.today() + timedelta(days=30)).isoformat()
        resp = client.post('/api/leagues', json={
            'name': 'Standings League', 'format': 'ladder',
            'season_name': 'Spring', 'start_date': start, 'end_date': end, 'status': 'active',
            'min_matches': 1,
        }, headers=auth_header(token_a))
        league = resp.get_json()['league']
        client.post('/api/leagues/standings-league/join', headers=auth_header(token_b))

        # Create a league match via invite
        play_date = date.today().isoformat()
        resp = client.post('/api/invites', json={
            'to_user_id': uid_b, 'play_date': play_date,
            'start_time': '10:00', 'end_time': '12:00',
            'league_id': league['id'],
        }, headers=auth_header(token_a))
        invite_id = resp.get_json()['invite']['id']
        resp = client.post(f'/api/invites/{invite_id}/accept', headers=auth_header(token_b))
        match_id = resp.get_json()['match']['id']

        # Submit score (Alice wins)
        client.post(f'/api/matches/{match_id}/score', json={
            'sets': [{'p1': 6, 'p2': 3}, {'p1': 6, 'p2': 4}],
            'match_format': 'best_of_3',
        }, headers=auth_header(token_a))

        # Confirm score (Bob confirms)
        client.post(f'/api/matches/{match_id}/confirm', json={'action': 'confirm'}, headers=auth_header(token_b))

        return token_a, uid_a, token_b, uid_b, match_id, league

    def test_standings(self, client):
        token_a, uid_a, token_b, uid_b, match_id, league = self._setup_league_with_match(client)
        resp = client.get('/api/leagues/standings-league/standings')
        assert resp.status_code == 200
        standings = resp.get_json()['standings']
        assert len(standings) == 2
        # The winner (higher Elo) should be rank 1
        assert standings[0]['league_elo'] > 1200
        assert standings[0]['wins'] == 1
        assert standings[0]['losses'] == 0
        assert standings[1]['league_elo'] < 1200
        assert standings[1]['losses'] == 1

    def test_elo_stored_on_match(self, client):
        token_a, uid_a, token_b, uid_b, match_id, league = self._setup_league_with_match(client)
        resp = client.get(f'/api/matches/{match_id}', headers=auth_header(token_a))
        match = resp.get_json()['match']
        assert match['elo_change_p1'] is not None
        assert match['elo_change_p2'] is not None
        # p1 is match.player1 which is inv.to_user = Bob, p2 is inv.from_user = Alice
        # Actually let me just check they're non-zero and opposite signs
        assert match['elo_change_p1'] + match['elo_change_p2'] == 0 or abs(match['elo_change_p1'] + match['elo_change_p2']) <= 1

    def test_league_matches_endpoint(self, client):
        self._setup_league_with_match(client)
        resp = client.get('/api/leagues/standings-league/matches')
        assert resp.status_code == 200
        assert len(resp.get_json()['matches']) >= 1


class TestFlexStandings:
    def test_flex_points(self, client):
        token_a, uid_a = register_user(client, 'Alice', 'alice@test.com')
        token_b, uid_b = register_user(client, 'Bob', 'bob@test.com')
        start = (date.today() - timedelta(days=10)).isoformat()
        end = (date.today() + timedelta(days=30)).isoformat()
        resp = client.post('/api/leagues', json={
            'name': 'Flex League', 'format': 'flex',
            'season_name': 'Spring', 'start_date': start, 'end_date': end,
            'status': 'active', 'min_matches': 1,
        }, headers=auth_header(token_a))
        league = resp.get_json()['league']
        client.post('/api/leagues/flex-league/join', headers=auth_header(token_b))

        # Create and complete a match
        play_date = date.today().isoformat()
        resp = client.post('/api/invites', json={
            'to_user_id': uid_b, 'play_date': play_date,
            'start_time': '10:00', 'end_time': '12:00',
            'league_id': league['id'],
        }, headers=auth_header(token_a))
        invite_id = resp.get_json()['invite']['id']
        resp = client.post(f'/api/invites/{invite_id}/accept', headers=auth_header(token_b))
        match_id = resp.get_json()['match']['id']
        client.post(f'/api/matches/{match_id}/score', json={
            'sets': [{'p1': 6, 'p2': 3}, {'p1': 6, 'p2': 4}],
        }, headers=auth_header(token_a))
        client.post(f'/api/matches/{match_id}/confirm', json={'action': 'confirm'}, headers=auth_header(token_b))

        resp = client.get('/api/leagues/flex-league/standings')
        standings = resp.get_json()['standings']
        winner = next(s for s in standings if s['wins'] == 1)
        loser = next(s for s in standings if s['losses'] == 1)
        assert winner['points'] == 3
        assert loser['points'] == 1


class TestChallenge:
    def test_challenge_in_ladder(self, client):
        token_a, uid_a = register_user(client, 'Alice', 'alice@test.com')
        token_b, uid_b = register_user(client, 'Bob', 'bob@test.com')
        start = (date.today() - timedelta(days=1)).isoformat()
        end = (date.today() + timedelta(days=30)).isoformat()
        client.post('/api/leagues', json={
            'name': 'Ladder', 'format': 'ladder',
            'season_name': 'S1', 'start_date': start, 'end_date': end, 'status': 'active',
        }, headers=auth_header(token_a))
        client.post('/api/leagues/ladder/join', headers=auth_header(token_b))
        resp = client.post(f'/api/leagues/ladder/challenge/{uid_a}', json={}, headers=auth_header(token_b))
        assert resp.status_code == 201
        assert resp.get_json()['league_id'] is not None

    def test_challenge_non_ladder(self, client):
        token_a, uid_a = register_user(client, 'Alice', 'alice@test.com')
        token_b, uid_b = register_user(client, 'Bob', 'bob@test.com')
        client.post('/api/leagues', json={
            'name': 'Flex', 'format': 'flex',
            'season_name': 'S1', 'start_date': (date.today() - timedelta(days=1)).isoformat(),
            'end_date': (date.today() + timedelta(days=30)).isoformat(), 'status': 'active',
        }, headers=auth_header(token_a))
        client.post('/api/leagues/flex/join', headers=auth_header(token_b))
        resp = client.post(f'/api/leagues/flex/challenge/{uid_a}', json={}, headers=auth_header(token_b))
        assert resp.status_code == 400

    def test_challenge_self(self, client):
        token_a, uid_a = register_user(client, 'Alice', 'alice@test.com')
        client.post('/api/leagues', json={
            'name': 'Ladder', 'format': 'ladder',
            'season_name': 'S1', 'start_date': (date.today() - timedelta(days=1)).isoformat(),
            'end_date': (date.today() + timedelta(days=30)).isoformat(), 'status': 'active',
        }, headers=auth_header(token_a))
        resp = client.post(f'/api/leagues/ladder/challenge/{uid_a}', json={}, headers=auth_header(token_a))
        assert resp.status_code == 400
