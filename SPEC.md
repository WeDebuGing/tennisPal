# TennisPal — Application Specification

> **Version:** 1.0 · **Date:** 2026-03-01 · **Author:** Auto-generated from source code

---

## Table of Contents

1. [Overview & Tech Stack](#1-overview--tech-stack)
2. [User Roles & Permissions](#2-user-roles--permissions)
3. [Authentication](#3-authentication)
4. [Onboarding Flow](#4-onboarding-flow)
5. [Feed / Looking to Play](#5-feed--looking-to-play)
6. [Match Invites](#6-match-invites)
7. [Match Lifecycle](#7-match-lifecycle)
8. [Score Submission & Validation](#8-score-submission--validation)
9. [Elo Rating System](#9-elo-rating-system)
10. [Player Profiles](#10-player-profiles)
11. [Leaderboard](#11-leaderboard)
12. [Availability System](#12-availability-system)
13. [Courts](#13-courts)
14. [Notifications](#14-notifications)
15. [Post-Match Reviews](#15-post-match-reviews)
16. [Matchmaking Suggestions](#16-matchmaking-suggestions)
17. [Settings](#17-settings)
18. [Admin Dashboard](#18-admin-dashboard)
19. [Known Limitations / TODO](#19-known-limitations--todo)

---

## 1. Overview & Tech Stack

**TennisPal** is a mobile-first web app for recreational tennis players to find opponents, schedule matches, track scores, and build a local tennis community.

### Tech Stack
| Layer | Technology |
|-------|-----------|
| **Backend** | Python / Flask, Flask-JWT-Extended, Flask-SQLAlchemy, Flask-CORS |
| **Database** | SQLite (file: `tennispal.db`) |
| **Frontend** | React 18 + TypeScript, Vite, TailwindCSS, React Query, React Router v6 |
| **Auth** | JWT (30-day expiry), bcrypt password hashing (werkzeug) |
| **Notifications** | In-app + optional Twilio SMS + SendGrid email |
| **Deployment** | Gunicorn on Debian VPS (72.61.12.118), nginx reverse proxy, systemd |

### Architecture
- SPA frontend served from `/frontend/dist` in release mode
- All API routes prefixed with `/api/`
- JWT token passed as `Authorization: Bearer <token>` header
- City-scoped data (currently Pittsburgh-focused)

---

## 2. User Roles & Permissions

### Regular User
- Register, login, complete onboarding
- Create/edit/delete own "Looking to Play" posts
- Send and receive match invites
- Submit and confirm scores
- View leaderboard, players, courts
- Manage own profile, availability, and notification settings
- Submit post-match reviews

### Admin
- All regular user permissions
- Access admin dashboard via separate login (`/api/admin/login`)
- View platform stats (users, matches, posts, notifications)
- Search/paginate users; edit user fields (name, email, NTRP, Elo, is_admin, is_banned)
- Ban/unban users
- View/filter/edit/delete matches
- Send broadcast or targeted notifications
- Auth: `X-Admin-Token` header with valid JWT of an `is_admin=True` user

### Banned User
- Cannot log in (receives "Your account has been suspended." 403 error)

### Acceptance Criteria
- [ ] Non-admin user cannot access `/api/admin/*` endpoints
- [ ] Banned user receives 403 on login attempt
- [ ] Admin token is validated on every admin endpoint

---

## 3. Authentication

### Register (`POST /api/auth/register`)
**Fields:** name (required), email or phone (at least one required), password (required), ntrp (optional, 1.0–7.0), city (default: "Pittsburgh")

**Business Rules:**
- Name and password are required; must provide email or phone
- Email must be unique; phone must be unique
- NTRP validated: must be float between 1.0 and 7.0
- Returns JWT token + user object; status 201
- New user starts with `elo=1200`, `onboarding_complete=False`

**Acceptance Criteria:**
- [ ] `POST /api/auth/register` with valid data → 201, returns `{token, user}`
- [ ] Missing name or password → 400
- [ ] No email and no phone → 400
- [ ] Duplicate email → 409 "Email already registered."
- [ ] Duplicate phone → 409 "Phone already registered."
- [ ] NTRP=8.0 → 400 "NTRP must be between 1.0 and 7.0."

### Login (`POST /api/auth/login`)
**Fields:** identifier (email or phone), password

**Business Rules:**
- Matches against both `email` and `phone` columns
- Banned users get 403
- Returns JWT token + user object on success

**Acceptance Criteria:**
- [ ] Valid credentials → 200, returns `{token, user}`
- [ ] Wrong password → 401 "Invalid credentials."
- [ ] Banned user → 403 "Your account has been suspended."

### Current User (`GET /api/auth/me`)
- Requires JWT; returns full user dict

---

## 4. Onboarding Flow

After registration, users must complete onboarding before accessing the main app. The frontend forces all routes to `<Onboarding />` until `onboarding_complete=True`.

### Steps (Frontend)
1. **Welcome** — greeting screen
2. **NTRP Selection** — pick skill level from predefined options:
   - 2.0: "Beginner — Learning basic strokes"
   - 2.5: "Beginner+ — Can sustain a short rally"
   - 3.0: "Intermediate — Consistent on medium-paced shots"
   - 3.5: "Intermediate+ — Improved consistency, developing variety"
   - 4.0: "Advanced Intermediate — Dependable strokes, directional control"
   - 4.5: "Advanced — Can use power and spin effectively"
   - 5.0: "Advanced+ — Strong shot anticipation, can vary game plan"
   - 5.5: "Expert — Can hit winners, tournament-level play"
3. **Contact Info** — name, email, phone
4. **Preferred Courts** — GPS-based nearby court selection (requests browser geolocation, 25km radius), searchable list, multi-select

### API (`PUT /api/onboarding`)
- Accepts: ntrp, name, phone, email, preferred_courts (array)
- Sets `onboarding_complete = True`
- Validates uniqueness of email/phone
- preferred_courts stored as JSON string

**Acceptance Criteria:**
- [ ] User with `onboarding_complete=False` is redirected to onboarding on all routes
- [ ] Completing onboarding sets flag to True; user can now access main app
- [ ] Duplicate phone during onboarding → 409
- [ ] GPS-based court list appears when geolocation is granted

---

## 5. Feed / Looking to Play

The home page shows a feed of "Looking to Play" posts — open requests from players seeking opponents.

### Data Model: `LookingToPlay`
| Field | Type | Notes |
|-------|------|-------|
| user_id | FK→User | Post author |
| play_date | Date | Must be today or future |
| start_time | String(5) | "HH:MM" format |
| end_time | String(5) | "HH:MM" format |
| court | String(100) | Default: "Flexible" |
| match_type | String(20) | Default: "singles" |
| level_min | Float | Optional NTRP floor |
| level_max | Float | Optional NTRP ceiling |
| claimed_by_id | FK→User | Set when post is claimed via accepted invite |

### Computed Properties
- `is_expired`: True if current time > `play_date + end_time`
- `is_active`: Not expired AND not claimed

### List Posts (`GET /api/posts`)
**Filters (query params):**
- `level_min`, `level_max` — NTRP range filter
- `court` — case-insensitive substring match
- `date_from`, `date_to` — date range (YYYY-MM-DD)

**Sorting (`sort` param):**
- `newest` (default) — by created_at desc
- `closest_date` — by play_date asc, then start_time
- `skill_match` — by distance between user's NTRP and post's level midpoint

**Personalization (`for_you=true`):**
- Scores each post based on NTRP fit (max 10pts for perfect range match) and court preference match (5pts)
- Sorts by score desc, then play_date

**Business Rules:**
- Only shows unclaimed posts with `play_date >= today`
- Filters out expired posts (past end_time)
- No auth required to view; auth needed for personalization features

### Create Post (`POST /api/posts`)
- Auth required
- Required: play_date, start_time, end_time
- play_date must be today or future
- Returns 201

### Edit Post (`PUT /api/posts/<id>`)
- Auth required; must be post owner
- Cannot edit if post is claimed
- Same validations as create

### Delete Post (`DELETE /api/posts/<id>`)
- Auth required; must be post owner
- Cannot delete if claimed

### Claim/Request Post (`POST /api/posts/<id>/claim`)
- Creates a `MatchInvite` (pending) to the post owner
- Cannot claim own post
- Cannot claim inactive post
- Prevents duplicate pending requests (same user + same post) → 409
- Creates notification for post owner
- Sends external notification (SMS/email) to post owner

**Acceptance Criteria:**
- [ ] Active posts visible on feed without login
- [ ] Expired posts (past end_time) hidden from feed
- [ ] Claimed posts hidden from feed
- [ ] Filter by NTRP range returns matching posts
- [ ] `sort=closest_date` orders by soonest first
- [ ] Post owner cannot claim own post → 400
- [ ] Duplicate claim → 409
- [ ] Claimed post cannot be edited or deleted → 400

---

## 6. Match Invites

Two paths create invites:
1. **Direct invite** (`POST /api/invites`) — player invites another player directly
2. **Post claim** (`POST /api/posts/<id>/claim`) — player requests to play from a feed post

### Data Model: `MatchInvite`
| Field | Type | Notes |
|-------|------|-------|
| from_user_id | FK→User | Sender |
| to_user_id | FK→User | Recipient |
| post_id | FK→LookingToPlay | Null for direct invites |
| play_date | Date | |
| start_time, end_time | String(5) | |
| court | String(100) | Default: "TBD" |
| match_type | String(20) | Default: "singles" |
| status | String(20) | `pending`, `accepted`, `declined` |

### Send Direct Invite (`POST /api/invites`)
- Cannot invite yourself → 400
- Creates notification + external notification to recipient

### Accept Invite (`POST /api/invites/<id>/accept`)
- Only the `to_user` can accept
- Must be `pending` status
- Creates a `Match` record (status: `scheduled`)
- If from a post: claims the post (`claimed_by_id = from_user_id`) and auto-declines all other pending requests for that post
- Notifies the invite sender

### Decline Invite (`POST /api/invites/<id>/decline`)
- Only the `to_user` can decline
- Must be `pending` status
- Notifies the invite sender

### View Invites (`GET /api/matches`)
- Returns: user's matches + `pending_invites` (received) + `sent_invites` (sent)

**Acceptance Criteria:**
- [ ] Accepting a post-based invite claims the post
- [ ] Other pending requests for the same post are auto-declined with notification
- [ ] Self-invite → 400
- [ ] Accepting already-accepted invite → 400
- [ ] Only recipient can accept/decline

---

## 7. Match Lifecycle

### States
```
scheduled → completed (score submitted) → confirmed (opponent confirms)
                                        → disputed (opponent disputes)
scheduled → cancelled
```

### Data Model: `Match`
| Field | Type | Notes |
|-------|------|-------|
| player1_id, player2_id | FK→User | |
| play_date | Date | |
| match_type | String(20) | "singles" |
| match_format | String(30) | "best_of_3", "pro_set", "best_of_5" |
| status | String(20) | "scheduled", "completed", "cancelled" |
| score | String(100) | Human-readable: "6-4, 6-3" |
| sets | Text (JSON) | Structured: `[{"p1":6,"p2":4},...]` |
| score_submitted_by | FK→User | |
| score_confirmed | Boolean | |
| score_disputed | Boolean | |
| winner_id | FK→User | |

### Upcoming Matches (`GET /api/matches/upcoming`)
- Returns scheduled matches with `play_date >= today`, sorted ascending
- Includes opponent details (name, NTRP)

### Recent Results (`GET /api/matches/recent`)
- Returns confirmed matches, sorted by play_date desc
- Default limit: 30

### Match Detail (`GET /api/matches/<id>`)
- Returns match data
- If participant + completed + confirmed: includes opponent contact info (email, phone)

### Cancel Match (`POST /api/matches/<id>/cancel`)
- Only participants can cancel
- Sets status to "cancelled"

**Acceptance Criteria:**
- [ ] Scheduled match appears in upcoming matches
- [ ] Cancelled match no longer appears as upcoming
- [ ] Opponent contact info only visible after score confirmation

---

## 8. Score Submission & Validation

### Submit Score (`POST /api/matches/<id>/score`)
- Only match participants can submit
- Cannot resubmit after confirmation

#### Structured Score (preferred)
Payload: `{ sets: [...], match_format: "best_of_3" }`

**Validation rules:**
- **best_of_3**: 2–3 sets required; first to win 2 sets
- **best_of_5**: 3–5 sets required; first to win 3 sets
- **pro_set**: exactly 1 set; at least one player reaches 8 games

**Per-set validation:**
- Scores must be integers 0–7
- At least one player must reach 6 games (normal set)
- 7 games only valid vs 5 or 6 opponent games
- 7-6 requires tiebreak scores: `{p1: int, p2: int}`
- Tiebreak winner must reach ≥7 and win by ≥2
- Tiebreak winner must match set winner
- No ties allowed in a set
- Match must end when deciding set is won (no extra sets)

**Winner auto-determined** from set scores.

#### Legacy Free-Text Score
Payload: `{ score: "6-4, 6-3", winner_id: <id> }`
- Score validated via regex: only digits, dashes, parentheses, commas, spaces
- Max 100 chars
- winner_id must be a match participant

### Confirm/Dispute Score (`POST /api/matches/<id>/confirm`)
- Only the non-submitter can confirm
- `action: "confirm"` → sets `score_confirmed = True`
- `action: "dispute"` → sets `score_disputed = True`
- Submitter cannot confirm own score → 400

**Acceptance Criteria:**
- [ ] Structured score `6-4, 6-3` in best_of_3 → accepted, winner auto-set
- [ ] `7-6` without tiebreak → 400
- [ ] 3 sets where first 2 are won by same player → 400 "Too many sets"
- [ ] Submitter tries to confirm own score → 400
- [ ] Already confirmed score cannot be resubmitted → 400
- [ ] Tiebreak `7-6(3)` with wrong winner side → 400

---

## 9. Elo Rating System

### Current State
- Default Elo: **1200** for new users
- Elo is stored on the `User` model as an integer
- **Elo is NOT automatically updated** after match confirmation (no calculation logic in code)
- Admins can manually set Elo via admin panel
- Leaderboard sorts by Elo descending

### Matchmaking Usage
- Elo proximity used in matchmaking scoring (max 30pts for close Elo)
- Elo difference ≤100 triggers "Similar Elo" reason

**Known Limitation:** Elo updates are not implemented. This is a TODO item.

---

## 10. Player Profiles

### View Own Profile (`GET /api/auth/me`)
- Full user data including stats

### View Other Player (`GET /api/players/<id>`)
- Full user data + match history (all matches, sorted by date desc)

### Edit Profile (`PUT /api/profile`)
Editable fields: name, phone, email, ntrp, city, preferred_courts

**Validation:**
- Name cannot be empty
- NTRP: must be valid 0.5 increment between 1.0–7.0 (valid values: 1.0, 1.5, 2.0, ..., 7.0)
- Email: regex validated, must be unique
- Phone: must be unique

### Computed Stats (on User model)
| Stat | Calculation |
|------|------------|
| wins | Count of confirmed matches where user is winner |
| losses | Count of confirmed matches where user is not winner |
| matches_played | Count of confirmed matches user participated in |
| unique_opponents | Count of distinct opponents in confirmed matches |
| reliability | `completed / (completed + cancelled + no_show) * 100` (100% if no data) |

### Head-to-Head (`GET /api/players/<id>/h2h`)
- Auth required
- Returns wins, losses, and match list between current user and target player
- Returns null if viewing own profile

### Profile Tags (`GET /api/users/<id>/tags`)
- Aggregates review tags from all reviews of this player
- **Public tags**: only tags with ≥2 endorsements
- **All tags**: complete list with counts

**Acceptance Criteria:**
- [ ] NTRP 3.7 → 400 "must be a valid level (1.0–7.0 in 0.5 increments)"
- [ ] Empty name → 400
- [ ] Duplicate email on different user → 409
- [ ] H2H returns correct win/loss counts between two players
- [ ] Profile tags with <2 endorsements hidden from public view

---

## 11. Leaderboard

### Endpoint (`GET /api/leaderboard`)
- **No auth required**
- Returns all users sorted by: Elo desc, then wins desc
- Fields: id, name, ntrp, elo, wins, losses, matches_played

**Acceptance Criteria:**
- [ ] Players sorted by Elo descending
- [ ] Tied Elo → higher wins first
- [ ] Accessible without login

---

## 12. Availability System

Weekly recurring time slots indicating when a player is free to play.

### Data Model: `Availability`
| Field | Type | Notes |
|-------|------|-------|
| user_id | FK→User | |
| day_of_week | Integer | 0=Monday, 6=Sunday |
| start_time | String(5) | "HH:MM" |
| end_time | String(5) | "HH:MM" |

### Endpoints
- `GET /api/availability` — list current user's slots
- `POST /api/availability` — add slot (day_of_week 0-6, start_time, end_time required)
- `DELETE /api/availability/<id>` — remove slot (only own slots)

### Usage
- Players page can filter by available day
- Matchmaking uses availability overlap for scoring

**Acceptance Criteria:**
- [ ] day_of_week=-1 → 400
- [ ] day_of_week=7 → 400
- [ ] Missing start_time → 400
- [ ] Cannot delete another user's slot → 403

---

## 13. Courts

### Data Model: `Court`
| Field | Type | Notes |
|-------|------|-------|
| name | String(200) | |
| address | String(300) | |
| lat, lng | Float | GPS coordinates |
| num_courts | Integer | Default: 1 |
| lighted | Boolean | Default: False |
| surface | String(50) | Default: "hard" |
| public | Boolean | Default: True |

### Endpoints
- `GET /api/courts` — list all courts; if `lat`+`lng` provided, includes `distance_km` and sorts by distance; optional `radius` filter
- `GET /api/courts/<id>` — single court
- `GET /api/courts/nearby` — requires `lat`+`lng`; default radius 5km

### Distance Calculation
- Haversine formula (great-circle distance in km)

### Seed Data
15 Pittsburgh-area courts pre-loaded (Arsenal Park, Schenley Park, Mellon Park, Highland Park, Frick Park, CMU, etc.)

**Acceptance Criteria:**
- [ ] `/api/courts/nearby` without lat/lng → 400
- [ ] Courts sorted by distance when coordinates provided
- [ ] Radius filter excludes far courts

---

## 14. Notifications

### Data Model: `Notification`
| Field | Type |
|-------|------|
| user_id | FK→User |
| message | String(500) |
| read | Boolean (default False) |
| created_at | DateTime |
| link | String(200), nullable |

### Endpoints
- `GET /api/notifications` — last 50, sorted by newest first
- `GET /api/notifications/unread-count` — integer count
- `POST /api/notifications/mark-read` — mark specific IDs or all as read

### Notification Triggers
| Event | Recipient | Message |
|-------|-----------|---------|
| Post claim (request) | Post owner | "{name} wants to play on {date}! Review and accept/decline." |
| Direct invite | Invitee | "{name} invited you to play on {date}!" |
| Invite accepted | Sender | "{name} accepted your request/invite for {date}!" |
| Invite declined | Sender | "{name} declined your request/invite." |
| Post request auto-declined | Requester | "Your request to play on {date} was declined — the poster chose another player." |
| Score submitted | Opponent | "{name} submitted a score: {score}. Please confirm." |
| Admin broadcast | Target users | Custom message |

### External Notifications
- **SMS** (Twilio): sent if `user.notify_sms=True` and phone exists and Twilio credentials configured
- **Email** (SendGrid): sent if `user.notify_email=True` and email exists and SendGrid credentials configured
- Graceful fallback: logs and continues if credentials missing

**Acceptance Criteria:**
- [ ] Unread count reflects actual unread notifications
- [ ] Mark-read with specific IDs only marks those
- [ ] Mark-read without IDs marks ALL as read
- [ ] Notification created on every trigger event listed above

---

## 15. Post-Match Reviews

Tag-based review system (no free-text, no star ratings).

### Data Model: `ReviewTag`
| Field | Type | Notes |
|-------|------|-------|
| name | String(50) | Unique |
| category | String(30) | play_style, sportsmanship, logistics, vibe |

### Seed Tags
- **play_style:** Big Server, Consistent Baseliner, Net Rusher, Heavy Topspin, Crafty, All-Court Player
- **sportsmanship:** Great Sport, Fair Calls, Encouraging, Competitive
- **logistics:** Punctual, Flexible Scheduling, Good Communication
- **vibe:** Fun Rally Partner, Intense Competitor, Great for Practice

### Data Model: `PlayerReview`
- reviewer_id, reviewee_id, match_id, tags (many-to-many)
- Unique constraint: one review per reviewer per match

### Submit Review (`POST /api/matches/<id>/review`)
- Auth required; must be match participant
- Match score must be confirmed first
- Must select at least 1 tag
- Cannot review same match twice → 409
- Reviewee is automatically the other participant

### Review Status (`GET /api/matches/<id>/review-status`)
- Returns whether current user has reviewed this match

### Available Tags (`GET /api/review-tags`)
- Returns tags grouped by category

**Acceptance Criteria:**
- [ ] Cannot review before score confirmation → 400
- [ ] Duplicate review → 409
- [ ] Zero tags selected → 400
- [ ] Invalid tag ID → 400
- [ ] Tags with ≥2 endorsements appear in player's public profile

---

## 16. Matchmaking Suggestions

### Endpoint (`GET /api/matchmaking/suggestions`)
Auth required. Returns all other users ranked by composite "match score".

### Scoring Algorithm (max 100 points)

| Factor | Max Points | Calculation |
|--------|-----------|-------------|
| Elo Proximity | 30 | `max(0, 30 - elo_diff/10)` |
| NTRP Similarity | 20 | `max(0, 20 - ntrp_diff*10)` |
| Availability Overlap | 25 | `min(25, overlap_minutes/60 * 5)` |
| Variety (new opponents) | 15 | `max(0, 15 - recent_matches*5)` |
| Reliability | 10 | `reliability/100 * 10` |

### Reasons Returned
- "Similar Elo" — Elo diff ≤100
- "Similar NTRP level" — NTRP diff ≤0.5
- "Overlapping schedule" — any availability overlap
- "New opponent" — 0 recent matches (last 30 days)
- "Highly reliable" — reliability ≥90%

### Response Fields
id, name, ntrp, elo, match_score, reasons, elo_diff, recent_matches, availability_overlap, reliability

**Acceptance Criteria:**
- [ ] User with identical Elo/NTRP/availability scores highest
- [ ] Player with 3 recent matches against user gets reduced variety score
- [ ] Suggestions sorted by match_score descending

---

## 17. Settings

### Notification Preferences
- `GET /api/settings` — returns `{notify_sms, notify_email}`
- `PUT /api/settings` — toggle SMS and/or email notifications

**Acceptance Criteria:**
- [ ] Toggle notify_email off → no email sent on next notification trigger
- [ ] Toggle notify_sms on → SMS sent if phone number and Twilio credentials exist

---

## 18. Admin Dashboard

### Authentication
- Login: `POST /api/admin/login` — must be `is_admin=True` user
- All admin endpoints require `X-Admin-Token` header with valid admin JWT

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | Platform overview stats |
| `/api/admin/users` | GET | Paginated user list with search |
| `/api/admin/users/<id>` | PUT | Edit user fields |
| `/api/admin/users/<id>/ban` | POST | Ban user |
| `/api/admin/users/<id>/unban` | POST | Unban user |
| `/api/admin/matches` | GET | Paginated match list with status filter |
| `/api/admin/matches/<id>` | PUT | Edit match (status, confirmed, disputed) |
| `/api/admin/matches/<id>` | DELETE | Delete match |
| `/api/admin/notifications` | POST | Send notification to specific users or broadcast |

### Stats Returned
total_users, banned_users, total_matches, completed_matches, scheduled_matches, disputed_matches, active_posts, pending_invites, total_notifications, unread_notifications, new_users_week, new_users_month

**Acceptance Criteria:**
- [ ] Non-admin JWT → 403 on admin endpoints
- [ ] Missing X-Admin-Token → 401
- [ ] Ban user → user cannot login
- [ ] Broadcast notification reaches all non-banned users

---

## 19. Known Limitations / TODO

1. **Elo not auto-updated** — Elo rating stored but never recalculated after matches. Need K-factor-based update on score confirmation.
2. **No password reset** — No forgot-password or reset flow.
3. **No image upload** — No profile pictures or court photos.
4. **SQLite** — Single-file DB; not suitable for high concurrency. Migration to PostgreSQL recommended for production.
5. **No real-time updates** — Polling-based; no WebSocket/SSE for live notifications.
6. **No email verification** — Emails accepted without confirmation.
7. **City is cosmetic** — City field exists but doesn't filter data (all users see all data).
8. **No doubles support** — match_type field exists but UI and logic are singles-only.
9. **No match time storage** — Matches track play_date but not specific time.
10. **No dispute resolution** — Disputed scores have no workflow; admin must intervene manually.
11. **Reliability stat counts no_show** — but no_show status is never set by any endpoint.
12. **Tiebreak display** — Shows minimum tiebreak score in parentheses (e.g., "7-6(5)") rather than winner's score.
13. **No rate limiting** — API has no request throttling.
14. **preferred_courts inconsistency** — Stored as JSON array via onboarding but as raw text via profile edit. Profile edit sends string; comparison logic splits on commas.
15. **No pagination on feed** — All active posts loaded at once.
