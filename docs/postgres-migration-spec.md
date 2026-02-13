# SQLite → PostgreSQL Migration Spec

**Status:** Draft  
**Date:** 2026-02-13  
**Author:** Auto-generated

---

## 1. Current SQLite Usage

### Database Configuration
Both the Flask (Jinja) app (`app.py`) and the API app (`api/app.py`) use:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tennispal.db'
```
Each creates its own `tennispal.db` in its respective `instance/` directory via `db.create_all()`.

### ORM
- **Flask-SQLAlchemy 3.1.1** with no migration tool (no Alembic)
- Schema is created via `db.create_all()` at startup
- Two copies of models exist: `models.py` (root, used by `app.py`) and `api/models.py` (used by `api/app.py`). They are nearly identical but diverge slightly (the API version has `sets`, `match_format` fields on `Match`, and `to_dict()` methods).

### Models / Tables

| Model | Table | Columns | Notes |
|---|---|---|---|
| **User** | `user` | `id` (PK, Integer), `name` (String 100), `email` (String 120, unique, nullable), `phone` (String 20, unique, nullable), `password_hash` (String 256), `ntrp` (Float, nullable), `elo` (Integer, default 1200), `created_at` (DateTime) | Mixin: `UserMixin` (root only). Has computed properties: `wins`, `losses`, `matches_played`, `unique_opponents`, `reliability` — all do N+1 queries. |
| **Availability** | `availability` | `id` (PK), `user_id` (FK → user.id), `day_of_week` (Integer, 0-6), `start_time` (String 5), `end_time` (String 5) | |
| **LookingToPlay** | `looking_to_play` | `id` (PK), `user_id` (FK → user.id), `play_date` (Date), `start_time` (String 5), `end_time` (String 5), `court` (String 100, default 'Flexible'), `match_type` (String 20, default 'singles'), `level_min` (Float, nullable), `level_max` (Float, nullable), `claimed_by_id` (FK → user.id, nullable), `created_at` (DateTime) | |
| **MatchInvite** | `match_invite` | `id` (PK), `from_user_id` (FK → user.id), `to_user_id` (FK → user.id), `play_date` (Date), `start_time` (String 5), `end_time` (String 5), `court` (String 100, default 'TBD'), `match_type` (String 20), `status` (String 20, default 'pending'), `created_at` (DateTime) | |
| **Match** | `match` | `id` (PK), `player1_id` (FK → user.id), `player2_id` (FK → user.id), `play_date` (Date), `match_type` (String 20), `status` (String 20, default 'scheduled'), `score` (String 100, nullable), `sets` (Text, nullable — JSON string, **API only**), `match_format` (String 30, default 'best_of_3', **API only**), `score_submitted_by` (FK → user.id, nullable), `score_confirmed` (Boolean, default False), `score_disputed` (Boolean, default False), `winner_id` (FK → user.id, nullable), `created_at` (DateTime) | `match` is a **reserved word** in PostgreSQL (and SQL). Must quote or rename. |
| **Notification** | `notification` | `id` (PK), `user_id` (FK → user.id), `message` (String 500), `read` (Boolean, default False), `created_at` (DateTime), `link` (String 200, nullable) | `read` may conflict with PostgreSQL keywords depending on context. |

### Relationships
- `User` → `Availability` (1:many, cascade delete-orphan)
- `User` → `LookingToPlay` (1:many via `user_id`)
- `User` ← `LookingToPlay.claimed_by_id` (nullable FK)
- `MatchInvite.from_user_id` / `to_user_id` → `User`
- `Match.player1_id` / `player2_id` / `score_submitted_by` / `winner_id` → `User`
- `Notification.user_id` → `User`

---

## 2. Migration Plan

### 2.1 Tooling

| Tool | Purpose |
|---|---|
| **Alembic** (via Flask-Migrate) | Schema versioning and migrations |
| **psycopg2-binary** | PostgreSQL driver for SQLAlchemy |
| **pgloader** or custom script | One-time data migration from SQLite → PostgreSQL |

### 2.2 Pre-Migration Steps

1. **Unify model files.** `models.py` and `api/models.py` must be consolidated into a single source of truth. The API version is the superset — use that.
2. **Add Flask-Migrate / Alembic.** Initialize with `flask db init`, generate initial migration from current schema, and stamp the SQLite database.
3. **Externalize `DATABASE_URI`.** Replace hardcoded `sqlite:///tennispal.db` with `os.environ['DATABASE_URL']` in both `app.py` and `api/app.py`. Remove `db.create_all()` calls (Alembic handles schema).
4. **Add `psycopg2-binary` to requirements.**
5. **Provision PostgreSQL** (local for dev, managed for prod — e.g., Supabase, Neon, RDS, or Railway).

### 2.3 Migration Steps

1. **Create Alembic migration** that represents the full current schema.
2. **Stand up PostgreSQL** and run the Alembic migration against it.
3. **Migrate data** from SQLite → PostgreSQL:
   - Option A: `pgloader` (handles type coercion automatically)
   - Option B: Custom Python script using SQLAlchemy to read from SQLite and write to PostgreSQL
   - Either way, verify row counts per table after migration.
4. **Run integration tests** against PostgreSQL.
5. **Switch `DATABASE_URL`** in deployment environment.
6. **Deploy.**

### 2.4 Rollback Strategy

- Keep SQLite file intact as a cold backup for at least 30 days.
- Alembic `downgrade` for schema rollback.
- For full rollback: revert `DATABASE_URL` to SQLite URI and redeploy.
- The app should remain SQLite-compatible during the transition window (no PostgreSQL-specific SQL).

---

## 3. Breaking Changes & SQLite Quirks

### 3.1 Reserved Words

| Issue | Fix |
|---|---|
| Table name `match` is a PostgreSQL reserved word | Rename to `matches` or use `__tablename__ = 'match'` with quoting. **Recommended: rename to `matches`.** |
| Column `read` on `Notification` | Technically a keyword but lowercase column names in SQLAlchemy are quoted. Verify no raw SQL uses it unquoted. |

### 3.2 Boolean Handling

SQLite stores booleans as `0`/`1` integers. PostgreSQL has a native `BOOLEAN` type. SQLAlchemy handles this transparently, but any raw SQL or direct DB queries must use `TRUE`/`FALSE` instead of `0`/`1`.

### 3.3 Date/DateTime Handling

SQLite stores dates as strings. PostgreSQL has native `DATE` and `TIMESTAMP` types. SQLAlchemy abstracts this, but:
- `datetime.utcnow` is used as a default — works fine, but consider switching to `func.now()` (server-side) for PostgreSQL.
- Time fields (`start_time`, `end_time`) are stored as `String(5)` ("HH:MM"). This is fine but consider migrating to PostgreSQL `TIME` type in a future iteration.

### 3.4 Auto-Increment

SQLite uses `ROWID`-based auto-increment. PostgreSQL uses `SERIAL` / `IDENTITY`. SQLAlchemy's `db.Column(db.Integer, primary_key=True)` handles this, but when importing data, the PostgreSQL sequence must be reset to `MAX(id) + 1` after bulk insert.

### 3.5 JSON Storage

`Match.sets` is stored as `db.Text` containing JSON. PostgreSQL has native `JSON`/`JSONB` types. **Recommended:** change column type to `db.JSON` or `JSONB` for query support and validation.

### 3.6 String Length Enforcement

SQLite ignores `String(N)` length limits. PostgreSQL enforces `VARCHAR(N)`. Audit existing data to ensure no values exceed declared lengths (especially `score` at 100 chars, `message` at 500 chars).

### 3.7 Duplicate Model Files

The two model files (`models.py` and `api/models.py`) have diverged:
- `api/models.py` has `Match.sets`, `Match.match_format`, and `to_dict()` methods
- `models.py` (root) lacks these

**This must be resolved before migration.** Single models file, imported by both apps.

### 3.8 N+1 Query Properties

`User.wins`, `User.losses`, `User.matches_played`, `User.unique_opponents`, and `User.reliability` all execute queries inside `@property`. This is a performance problem on any database but will be more noticeable on PostgreSQL (network round-trips vs SQLite's in-process calls). Consider denormalizing or caching these.

---

## 4. Deployment Considerations

1. **Environment variable:** Use `DATABASE_URL` (standard for Heroku, Railway, Render, etc.). Parse with `sqlalchemy.engine.url.make_url` if needed.
2. **Connection pooling:** SQLite needs no pooling. PostgreSQL benefits from it. SQLAlchemy's default pool is fine for low traffic; consider PgBouncer for production scale.
3. **SSL:** Most managed PostgreSQL providers require `sslmode=require`. Append `?sslmode=require` to the URI or configure via `connect_args`.
4. **Migrations in CI/CD:** Run `flask db upgrade` as part of deploy pipeline (before app start).
5. **Downtime:** The data migration itself can be done with a brief maintenance window. For a small app, expect < 5 minutes.
6. **Testing:** Run the full test suite (if one exists) against PostgreSQL before cutting over. At minimum, manually test all CRUD flows.

---

## 5. Dependency Changes

```diff
# requirements.txt
+ Flask-Migrate==4.0.5
+ psycopg2-binary==2.9.9
+ python-dotenv==1.0.0
```

---

## 6. File Changes Summary

| File | Change |
|---|---|
| `models.py` | Delete (consolidate into `api/models.py` or shared `models/`) |
| `api/models.py` | Canonical model file. Rename `match` table. Change `sets` to `JSON` type. |
| `app.py` | Import from shared models. Use `DATABASE_URL` env var. Remove `db.create_all()`. |
| `api/app.py` | Use `DATABASE_URL` env var. Remove `db.create_all()`. Add Flask-Migrate init. |
| `requirements.txt` | Add `Flask-Migrate`, `psycopg2-binary`, `python-dotenv` |
| `migrations/` | New directory (Alembic). Generated via `flask db init`. |
| `.env` / `.env.example` | Add `DATABASE_URL` |
