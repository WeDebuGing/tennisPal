# TennisPal CI/CD Proposal

> **Date:** 2026-02-12 | **Status:** Proposal (not yet implemented) | **Repo:** [WeDebuGing/tennisPal](https://github.com/WeDebuGing/tennisPal)

## Project Structure

- **Backend:** Flask API (`app.py`, `models.py`, `api/`) + `requirements.txt`
- **Frontend:** React app (`frontend/`)
- **Branch:** `main`

---

## 1. CI — GitHub Actions (Recommended)

GitHub Actions is the natural choice since the repo is already on GitHub. Zero extra accounts needed.

### Proposed Workflows

#### `ci.yml` — Runs on every PR and push to `main`
- **Backend:** Install Python deps → lint (flake8/ruff) → run tests (pytest)
- **Frontend:** Install Node deps → lint (eslint) → run tests (vitest/jest) → build check

#### `deploy.yml` — Runs on push to `main` (after CI passes)
- Triggers deployment to chosen hosting platforms (see below)

### Pros
- Free for public repos (2,000 min/month for private)
- Native GitHub integration (status checks, PR gates)
- Huge ecosystem of reusable actions
- Matrix testing (multiple Python/Node versions) is trivial

### Cons
- YAML config can be verbose
- Debugging failing workflows requires push-and-wait cycles

---

## 2. Frontend Hosting & CD

### Option A: Vercel ⭐ Recommended

| Aspect | Details |
|--------|---------|
| **Setup** | Connect repo → auto-detects React → done |
| **Deploys** | Preview deploy on every PR, production on `main` merge |
| **Free tier** | Generous (100 GB bandwidth, serverless functions) |
| **Custom domains** | Built-in with auto SSL |

**Pros:** Zero-config for React, instant preview URLs per PR, excellent DX, global CDN.
**Cons:** Vendor lock-in for serverless functions; free tier has commercial use restrictions.

### Option B: GitHub Pages (via Actions)

**Pros:** Completely free, stays within GitHub ecosystem.
**Cons:** Static only (no SSR), no preview deploys, manual workflow setup.

### Verdict
**Vercel** — the preview-deploy-per-PR workflow alone justifies it. Setup takes ~5 minutes.

---

## 3. Backend Hosting & CD

### Option A: Railway ⭐ Recommended

| Aspect | Details |
|--------|---------|
| **Setup** | Connect repo, auto-detects Flask via `requirements.txt` |
| **Deploys** | Auto-deploy on `main` push |
| **Free tier** | $5 free credit/month, then pay-as-you-go |
| **Database** | One-click Postgres/Redis add-ons |
| **Env vars** | Built-in secrets management |

**Pros:** Easiest DX of the three, built-in DB provisioning, preview environments, near-instant deploys.
**Cons:** Free tier is limited ($5/month credit); can get expensive at scale.

### Option B: Render

| Aspect | Details |
|--------|---------|
| **Free tier** | Free web service (spins down after 15 min inactivity) |
| **Deploys** | Auto-deploy from `main` |
| **Database** | Free Postgres (90-day expiry on free tier) |

**Pros:** True free tier for hobby projects, simple setup, managed Postgres.
**Cons:** Cold starts on free tier (~30-50s spin-up), free DB expires after 90 days.

### Option C: Fly.io

| Aspect | Details |
|--------|---------|
| **Setup** | Requires `fly.toml` + Dockerfile or buildpack config |
| **Free tier** | 3 shared VMs, 3 GB persistent storage |
| **Deploys** | Via `flyctl deploy` (triggered from GitHub Actions) |

**Pros:** Multi-region edge deployment, persistent VMs (no cold starts), great for WebSocket/real-time features.
**Cons:** Steeper learning curve, requires Dockerfile, CLI-driven deploys, billing requires credit card even for free tier.

### Verdict
**Railway** for speed and simplicity. If budget is a concern and cold starts are acceptable, **Render**'s free tier works for a side project. Fly.io is overkill unless you need multi-region or persistent connections.

---

## 4. Recommended Stack Summary

```
GitHub Actions (CI)
  ├── Lint + Test (every PR)
  └── Deploy (on main merge)
        ├── Frontend → Vercel (auto-deploy via Git integration)
        └── Backend  → Railway (auto-deploy via Git integration)
```

Both Vercel and Railway have native GitHub integrations, so the deploy step in GitHub Actions is optional — they can auto-deploy on push to `main` independently. GitHub Actions primarily handles the **test gate** to prevent broken code from reaching production.

---

## 5. Implementation Steps (When Ready)

1. **Add basic tests** — even a smoke test for each side (e.g., `pytest` for Flask routes, `vitest` for React components)
2. **Create `.github/workflows/ci.yml`** — lint + test on PR
3. **Connect Vercel** — link repo, set `frontend/` as root directory
4. **Connect Railway** — link repo, set root to `/` or `api/`, add env vars (DB URL, secrets)
5. **Add branch protection** — require CI pass before merge to `main`
6. **Add a `Dockerfile`** (optional) — for backend if you want reproducible builds

---

## 6. Cost Estimate (Monthly)

| Service | Free Tier | Paid Estimate |
|---------|-----------|---------------|
| GitHub Actions | 2,000 min (private) / unlimited (public) | $0 |
| Vercel | 100 GB BW, 100 deploys/day | $0 for hobby |
| Railway | $5 credit | ~$5-10 for light usage |
| **Total** | **$0-5/mo** | **$5-10/mo** |

---

*This is a research proposal only — no infrastructure changes have been made.*
