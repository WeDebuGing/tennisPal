# TennisPal UX Feedback Report

*Tested February 13, 2026 by three simulated personas*

---

## Registration & Onboarding

**[Sarah] Issue:** After registering, I was just dumped onto the home feed with no welcome message, confirmation, or tutorial. I wasn't sure if my account was actually created.
**Severity:** high
**Suggestion:** Show a "Welcome to TennisPal!" confirmation with a quick onboarding flow — set availability, explain NTRP, suggest first actions.

**[Jenny] Issue:** I don't know what "NTRP Level" means. The registration form says it's optional but doesn't explain what it is or why I should care. I skipped it and now my profile has no level at all.
**Severity:** high
**Suggestion:** Add a tooltip or link explaining NTRP ratings. Better yet, offer a simple self-assessment quiz ("How long have you been playing? How often?") to suggest a level. Show what happens if you skip it.

**[Jenny] Issue:** I registered without a phone number and it just... worked? No indication if phone is required or optional. No asterisks on required fields.
**Severity:** medium
**Suggestion:** Mark required fields with asterisks. If phone is optional, say "optional" explicitly.

**[Mike] Issue:** The login form says "Email or Phone" but there's no indication which seed accounts exist or that I can log in with either. Minor, but the placeholder could be clearer.
**Severity:** low
**Suggestion:** Use separate labeled fields or a clearer placeholder like "your@email.com or phone number".

---

## Home Feed (Looking to Play)

**[Sarah] Issue:** When I clicked "I'm In! 🎾" on Steve's post, the card just disappeared with zero feedback. No "Request sent!" toast, no confirmation. I genuinely didn't know if anything happened.
**Severity:** high
**Suggestion:** Show a success toast/banner like "🎾 You're matched with Steve! Check your Matches tab." Make it obvious what just happened.

**[Mike] Issue:** I can see posts from players way below my level (Sarah's 2.5-3.5 post) with an "I'm In!" button. There's no warning that I'm outside their requested level range. As a competitive player, I'd waste their time and mine.
**Severity:** high
**Suggestion:** Either hide posts outside your NTRP range, show a warning ("You're above the requested level"), or let the poster approve/reject responses.

**[Sarah] Issue:** I can't filter or sort the feed at all. No way to show only posts near my level, in my area, or on specific days. I have to scroll through everything including 4.5+ players I'd never play with.
**Severity:** high
**Suggestion:** Add filters for: NTRP range, date, location, match type (singles/doubles/hitting).

**[Jenny] Issue:** Since I don't have an NTRP level, I have no idea which posts are appropriate for me. All posts show a level range but I don't know where I fit. Everything looks the same.
**Severity:** high
**Suggestion:** For users without NTRP, show a prompt to set their level, or highlight "beginner-friendly" posts.

**[Mike] Issue:** "I'm In!" immediately creates a match — the poster gets no say. I expected it to send a request that the poster could accept or decline. What if 5 people click "I'm In!"?
**Severity:** high
**Suggestion:** Change to a request/accept flow: clicking "I'm In!" sends a request, poster reviews and confirms. This is standard for tennis partner apps.

**[Sarah] Issue:** My own post appears in the feed but there's no way to edit or delete it. I posted for today but what if I need to change the time?
**Severity:** high
**Suggestion:** Add edit/delete buttons on your own posts. Show a "Your Post" badge so it's clearly yours.

---

## Player Profiles & Players List

**[Mike] Issue:** The Players page lists everyone alphabetically with no search or NTRP filter. I have to scroll through 26+ players to find someone at my level. This won't scale.
**Severity:** high
**Suggestion:** Add search by name and filter by NTRP range. Sort options (by ELO, by level, by name).

**[Mike] Issue:** On player profiles, there's no way to directly invite someone to play or send them a message. I can see their availability but can't act on it.
**Severity:** high
**Suggestion:** Add "Invite to Play" and/or "Send Message" buttons on player profiles.

**[Sarah] Issue:** Clicking on a player shows their profile with stats, but there's no back button. I have to use the bottom nav to get back to the Players list.
**Severity:** medium
**Suggestion:** Add a back arrow/button at the top of player profile pages.

**[Mike] Issue:** Daniel Cooper's profile shows "Fri 18:00–20:00" listed twice — duplicate availability entries.
**Severity:** medium
**Suggestion:** Deduplicate availability slots in the display, or better yet, prevent duplicates in the availability management UI.

---

## Profile & Settings

**[Sarah] Issue:** My profile page has no way to edit my name, NTRP level, email, or phone number. I can't update anything about myself.
**Severity:** high
**Suggestion:** Add an "Edit Profile" button with editable fields for all user info.

**[Jenny] Issue:** I skipped NTRP during registration and now there's no way to add it. My profile just shows "ELO 1200" with no level. I'm stuck.
**Severity:** high
**Suggestion:** Let users set/update NTRP from their profile page at any time.

**[Sarah] Issue:** The profile page shows my email and phone in plain text. Anyone looking over my shoulder can see it. No privacy settings at all.
**Severity:** medium
**Suggestion:** Allow users to choose what's visible to other players (email, phone, or neither). Maybe mask partially: "s***@test.com".

---

## Availability

**[Sarah] Issue:** The Manage Availability page has no explanation of what it does or how it connects to being found by other players. I see day/time dropdowns but don't know why I should fill this out.
**Severity:** medium
**Suggestion:** Add a brief explanation: "Set your weekly availability so other players can find you when you're free to play."

**[Jenny] Issue:** I can add availability slots but can't see which ones I've already added, and there's no way to remove a slot.
**Severity:** medium
**Suggestion:** Show existing availability slots with delete buttons below the add form.

---

## Matches

**[Sarah] Issue:** My match with Steve Sanchez shows "scheduled" but there's no way to contact Steve — no email, phone, or in-app message. How do we coordinate meeting up?
**Severity:** high
**Suggestion:** Show the other player's contact info on the match detail page, or add in-app messaging.

**[Mike] Issue:** The match detail page immediately shows a score submission form, even for matches that haven't happened yet (they're scheduled for the future). That's confusing — why would I submit a score for a match that hasn't been played?
**Severity:** medium
**Suggestion:** Hide the score form until the match date has passed, or add a "Mark as Played" step first.

**[Sarah] Issue:** Score submission has "Best of 3", "Best of 5", and "Pro Set" options but no explanation. I play casual tennis and I don't know what "Pro Set (first to 8)" means.
**Severity:** low
**Suggestion:** Add brief explanations or tooltips for each format.

---

## Leaderboard

**[Mike] Issue:** The leaderboard NTRP numbers are concatenated with player names — "Ann Williams4", "Nicole Vaughn4.5". It's a display bug that makes it hard to read.
**Severity:** high
**Suggestion:** Fix the CSS/layout to put NTRP in a separate column or add spacing.

**[Mike] Issue:** The leaderboard is sorted by number of wins, not by ELO. Ann Williams (ELO 1104, 4W-2L) is ranked #1 while Elizabeth Stewart (ELO 1574, 2W-5L) is #8. If ELO is the ranking system, sort by ELO.
**Severity:** high
**Suggestion:** Sort by ELO (or make the sort criteria explicit and toggleable). The current ranking doesn't make sense — it rewards playing more games regardless of skill.

**[Jenny] Issue:** The leaderboard shows test accounts (Gordon Test, QA Tester, Outsider) mixed in with real players. It looks unfinished.
**Severity:** medium
**Suggestion:** Hide test/admin accounts from public-facing pages, or add a way to flag accounts as test data.

---

## Notifications

**[Sarah] Issue:** The notifications page says "No notifications" even though I just joined a match. Shouldn't I get a confirmation notification? Shouldn't Steve get one too?
**Severity:** high
**Suggestion:** Generate notifications for: match created, match request received, match confirmed, match cancelled, score submitted.

**[Mike] Issue:** The 🔔 notification bell in the header has no badge/count. Even if there were notifications, I wouldn't know without clicking it.
**Severity:** medium
**Suggestion:** Show an unread count badge on the bell icon when there are new notifications.

---

## General UX

**[Sarah] Issue:** There's no onboarding or tutorial. A first-time user lands on the feed with no guidance. What should I do first — post, browse, set availability?
**Severity:** high
**Suggestion:** Add a first-time user walkthrough or at least a welcome banner with suggested first steps.

**[Jenny] Issue:** The app shows all posts regardless of whether they match my skill level, area, or availability. As a brand new player with no NTRP set, I feel overwhelmed and lost. Nothing feels personalized.
**Severity:** high
**Suggestion:** Personalize the feed based on user level and availability. Show "Recommended for you" matches. Prompt to complete profile if info is missing.

**[Mike] Issue:** No way to see my own active posts from anywhere except the feed. If I posted multiple times, I'd have to scroll through everyone's posts to find mine.
**Severity:** medium
**Suggestion:** Add a "My Posts" section to the Profile page or a separate tab.

**[Sarah] Issue:** The password field during registration doesn't show/hide toggle or any password requirements. I used "tennis123" — is that strong enough? No idea.
**Severity:** low
**Suggestion:** Add password strength indicator and a show/hide toggle.

**[Jenny] Issue:** The bottom nav icons ("🏠 Home", "👥 Players", "➕ Post", "🎾 Matches", "👤 Profile") are fine, but "Post" is confusing — I thought it meant "see posts", not "create a post". The ➕ icon helps but the word "Post" is ambiguous.
**Severity:** low
**Suggestion:** Rename to "New Post" or "Find a Hit" to make the action clearer.

---

## Summary by Severity

| Severity | Count |
|----------|-------|
| 🔴 High | 16 |
| 🟡 Medium | 9 |
| 🟢 Low | 4 |

### Top 5 Most Impactful Issues
1. **No feedback after "I'm In!"** — Users don't know if their action worked
2. **No request/accept flow** — Matches are created instantly without poster consent
3. **No profile editing** — Users can't update NTRP, name, or contact info after registration
4. **No feed filtering** — All posts shown regardless of level match
5. **No notifications** — The notification system appears non-functional
