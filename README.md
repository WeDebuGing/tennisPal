# 🎾 TennisPal

A tennis match finding and organizing web app. Find players, schedule matches, track scores, and climb the leaderboard.

## Features

- **Player Feed** — Post when you're looking to play; others can claim your post instantly
- **Player Directory** — Browse players, filter by availability day
- **Match Invites** — Invite specific players for a match; they accept or decline
- **Score Tracking** — Submit and confirm scores with full match history
- **Leaderboard** — W-L records, NTRP levels, ELO (placeholder)
- **Player Profiles** — Stats, availability, match history, head-to-head records
- **Weekly Availability** — Set recurring time slots so others know when you play
- **Reliability Score** — Track follow-through on confirmed matches

## Stack

- **Backend:** Flask + SQLAlchemy + SQLite
- **Frontend:** Tailwind CSS (CDN) — mobile-first responsive design
- **Auth:** Flask-Login with password hashing

## Quick Start

```bash
# Clone
git clone https://github.com/WeDebuGing/tennisPal.git
cd tennisPal

# Install dependencies
pip install -r requirements.txt

# Seed sample data (20 players, matches, posts)
python seed.py

# Run the app
python app.py
```

Open [http://localhost:5001](http://localhost:5001)

**Demo login:** Any seeded player's email with password `tennis123`

## Project Structure

```
tennisPal/
├── app.py              # Flask routes and config
├── models.py           # SQLAlchemy models
├── seed.py             # Sample data generator
├── requirements.txt
├── templates/          # Jinja2 templates (Tailwind CSS)
│   ├── base.html       # Layout with bottom nav
│   ├── index.html      # Feed — looking to play posts
│   ├── login.html / register.html
│   ├── players.html    # Player directory
│   ├── player.html     # Player profile + H2H
│   ├── post.html       # Create a post
│   ├── matches.html    # My matches + invites
│   ├── match.html      # Match detail + score submission
│   ├── availability.html
│   ├── leaderboard.html
│   ├── notifications.html
│   └── invite.html
└── static/
```

## Roadmap

- [ ] Twilio SMS notifications
- [ ] SendGrid email verification
- [ ] ELO rating calculation
- [ ] Court booking integration
- [ ] Doubles partner matching
