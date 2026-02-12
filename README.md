# 🎾 TennisPal

Find tennis partners, schedule matches, track scores and climb the leaderboard.

## Architecture

- **Backend**: Flask REST API (`api/`) — SQLAlchemy + SQLite, JWT auth
- **Frontend**: React + TypeScript + Vite + Tailwind CSS (`frontend/`)

## Quick Start

### 1. Backend

```bash
cd api
source ../venv/bin/activate
pip install -r requirements.txt
python seed.py   # Seeds 20 players, posts, and matches
python app.py    # Runs on http://localhost:5001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev      # Runs on http://localhost:5173 (proxied to API)
```

### Login

Any seeded player — use their email and password `tennis123`.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register |
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/posts` | No | Feed |
| POST | `/api/posts` | Yes | Create post |
| POST | `/api/posts/:id/claim` | Yes | Claim a post |
| GET | `/api/players` | No | Player directory |
| GET | `/api/players/:id` | No | Player profile |
| GET | `/api/players/:id/h2h` | Yes | Head-to-head |
| GET/POST | `/api/availability` | Yes | Manage availability |
| DELETE | `/api/availability/:id` | Yes | Remove slot |
| POST | `/api/invites` | Yes | Send invite |
| POST | `/api/invites/:id/accept` | Yes | Accept invite |
| POST | `/api/invites/:id/decline` | Yes | Decline invite |
| GET | `/api/matches` | Yes | My matches + invites |
| GET | `/api/matches/:id` | Yes | Match detail |
| POST | `/api/matches/:id/score` | Yes | Submit score |
| POST | `/api/matches/:id/confirm` | Yes | Confirm/dispute score |
| POST | `/api/matches/:id/cancel` | Yes | Cancel match |
| GET | `/api/leaderboard` | No | Leaderboard |
| GET | `/api/notifications` | Yes | Notifications |

## Project Structure

```
tennisPal/
├── api/
│   ├── app.py, models.py, seed.py
│   └── requirements.txt
├── frontend/
│   ├── src/ (React app)
│   ├── package.json, vite.config.ts
│   └── index.html
└── README.md
```
