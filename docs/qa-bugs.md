# TennisPal QA Bug Report

**Date:** 2026-02-13  
**Tester:** QA Subagent  
**API Base:** http://localhost:5001

---

## 🔴 Critical Bugs

### BUG-1: Users can invite themselves to play
**Severity:** Critical  
**Endpoint:** `POST /api/invites`

**Command:**
```bash
curl -s -X POST http://localhost:5001/api/invites \
  -H "Authorization: Bearer $TOKEN1" -H 'Content-Type: application/json' \
  -d '{"to_user_id":1,"play_date":"2026-02-21","start_time":"14:00","end_time":"16:00"}'
```
**Result:** 201 Created — invite successfully created from user 1 to user 1.  
**Expected:** 400 error "You cannot invite yourself."

---

### BUG-2: Self-invite can be accepted, creating a self-match (player1 == player2)
**Severity:** Critical  
**Endpoint:** `POST /api/invites/:id/accept`

**Command:**
```bash
curl -s -X POST http://localhost:5001/api/invites/2/accept \
  -H "Authorization: Bearer $TOKEN1" -H 'Content-Type: application/json'
```
**Result:** 200 — Match created with `player1_id=1, player2_id=1` (same person).  
**Expected:** Should not be possible if BUG-1 is fixed. Also, accept endpoint should validate `from_user_id != to_user_id`.

---

### BUG-3: Legacy free-text score submission has zero validation
**Severity:** Critical  
**Endpoint:** `POST /api/matches/:id/score`

**Command:**
```bash
curl -s -X POST http://localhost:5001/api/matches/34/score \
  -H "Authorization: Bearer $TOKEN1" -H 'Content-Type: application/json' \
  -d '{"score":"999-0, chicken dinner","winner_id":1}'
```
**Result:** 200 — Score saved as "999-0, chicken dinner".  
**Expected:** Either remove legacy mode or validate the score string format.

---

### BUG-4: Legacy score allows setting winner_id to a user not in the match
**Severity:** Critical  
**Endpoint:** `POST /api/matches/:id/score`

**Command:**
```bash
curl -s -X POST http://localhost:5001/api/matches/34/score \
  -H "Authorization: Bearer $TOKEN1" -H 'Content-Type: application/json' \
  -d '{"score":"6-4, 6-3","winner_id":999}'
```
**Result:** 200 — `winner_id` set to 999 (nonexistent user).  
**Expected:** 400 error — winner_id must be one of the two match participants.

---

### BUG-5: Any authenticated user can confirm a score (no participant check)
**Severity:** Critical  
**Endpoint:** `POST /api/matches/:id/confirm`

**Command:**
```bash
# TOKEN3 belongs to user 25 who is NOT in match 34
curl -s -X POST http://localhost:5001/api/matches/34/confirm \
  -H "Authorization: Bearer $TOKEN3" -H 'Content-Type: application/json' \
  -d '{"action":"confirm"}'
```
**Result:** 200 — Score confirmed by a third party not involved in the match.  
**Expected:** 403 error — only match participants (excluding the score submitter) should confirm.

---

## 🟠 Medium Bugs

### BUG-6: Creating a post with missing required fields returns 500 instead of 400
**Severity:** Medium  
**Endpoint:** `POST /api/posts`

**Command:**
```bash
curl -s -X POST http://localhost:5001/api/posts \
  -H "Authorization: Bearer $TOKEN1" -H 'Content-Type: application/json' \
  -d '{"play_date":"2026-02-20"}'
```
**Result:** 500 Internal Server Error (HTML error page).  
**Expected:** 400 with JSON error message like `{"error": "start_time and end_time are required"}`.

---

### BUG-7: Posts can be created with past dates
**Severity:** Medium  
**Endpoint:** `POST /api/posts`

**Command:**
```bash
curl -s -X POST http://localhost:5001/api/posts \
  -H "Authorization: Bearer $TOKEN1" -H 'Content-Type: application/json' \
  -d '{"play_date":"2020-01-01","start_time":"10:00","end_time":"12:00"}'
```
**Result:** 201 — Post created with date 2020-01-01 (6 years ago). `is_active` is false but it's still in the DB.  
**Expected:** 400 error — play_date must be today or in the future.

---

### BUG-8: Invalid day_of_week in availability causes 500 error
**Severity:** Medium  
**Endpoint:** `POST /api/availability`

**Command:**
```bash
curl -s -X POST http://localhost:5001/api/availability \
  -H "Authorization: Bearer $TOKEN1" -H 'Content-Type: application/json' \
  -d '{"day_of_week":99,"start_time":"10:00","end_time":"12:00"}'
```
**Result:** 500 Internal Server Error (crashes when `day_name` property tries `DAY_NAMES[99]`).  
**Expected:** 400 error — day_of_week must be 0-6.

---

### BUG-9: No profile update endpoint exists
**Severity:** Medium  
**Endpoint:** `PUT /api/auth/me` (missing)

**Command:**
```bash
curl -s -X PUT http://localhost:5001/api/auth/me \
  -H "Authorization: Bearer $TOKEN1" -H 'Content-Type: application/json' \
  -d '{"name":"Updated Name"}'
```
**Result:** 405 Method Not Allowed.  
**Expected:** Users should be able to update their name, NTRP, city, etc.

---

### BUG-10: Score can be overwritten multiple times without restriction
**Severity:** Medium  
**Endpoint:** `POST /api/matches/:id/score`

Either participant can submit scores repeatedly, overwriting the previous score each time — even after confirmation. No check for `match.score_confirmed == True` before allowing resubmission.

---

## 🟡 Low Bugs

### BUG-11: No duplicate invite prevention
**Severity:** Low  
**Endpoint:** `POST /api/invites`

A user can send unlimited pending invites to the same person for the same date. No deduplication.

---

### BUG-12: Invite endpoints don't validate play_date is in the future
**Severity:** Low  
**Endpoint:** `POST /api/invites`

Invites can be sent for past dates.

---

## ✅ Working Correctly

| Flow | Status |
|------|--------|
| Register new user | ✅ |
| Duplicate email registration blocked | ✅ |
| Empty fields validation on register | ✅ |
| Login with valid credentials | ✅ |
| Login with wrong password | ✅ Rejected |
| Browse players | ✅ |
| Filter players by day | ✅ |
| View leaderboard | ✅ |
| Create post (valid) | ✅ |
| Claim own post blocked | ✅ |
| Claim post by other user | ✅ |
| Claim already-claimed post blocked | ✅ |
| Accept invite (valid) | ✅ |
| Structured score validation (8-6 rejected) | ✅ |
| Structured score validation (7-6 needs tiebreak) | ✅ |
| Valid structured score submission | ✅ |
| Confirm own score blocked | ✅ |
| Confirm as opponent | ✅ |
| Notifications created and retrieved | ✅ |
| H2H stats | ✅ |
| Protected endpoints require auth | ✅ |
| Delete other user's availability blocked | ✅ |
| 404 on nonexistent invite | ✅ |
