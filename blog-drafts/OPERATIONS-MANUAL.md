# RemodelerIQ Content Engine — Day 1 Operations Manual

Last updated: 2026-05-29 (before Friday 6pm Phase 1 launch)

This is the single-page runbook for the first 14 days of the Reddit + Nextdoor content engine. Read it once, refer back when something feels off.

---

## The system at a glance

```
┌─────────────────────────────────────────────────────────────┐
│ EVERY 6 HOURS (cron)                                        │
│  Reddit Scout fetches new posts → queues bid questions      │
│  → Gemini drafts replies → drafts land in your kanban       │
├─────────────────────────────────────────────────────────────┤
│ EVERY MORNING 7am ET (cron)                                 │
│  Email digest summarizing drafts awaiting review            │
├─────────────────────────────────────────────────────────────┤
│ EVERY 12 HOURS (cron)                                       │
│  Engagement tracker polls published Reddit URLs for         │
│  upvote/comment counts                                      │
├─────────────────────────────────────────────────────────────┤
│ TUE / THU / SAT — YOUR ACTION                               │
│  Open /admin/content. Review drafts. Approve / edit / kill. │
│  Copy approved → paste to Reddit/Nextdoor manually.         │
│  Mark Published with the posted URL.                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Friday 6pm ET — Phase 1 launch

### Pre-launch checklist (5pm)

- [ ] Open https://remodeleriq.com/admin/content
- [ ] Confirm at least 4 drafts in the In Review column
- [ ] Pick 3 Reddit drafts + 1 Nextdoor post for the launch
- [ ] Open Reddit in another tab, signed into your account
- [ ] Open Nextdoor in another tab, signed in as RemodelerIQ page
- [ ] Pour a glass of something. This is a 30-minute exercise, not a 3-hour one.

### Reddit posting protocol (Phase 1 — weeks 1-2)

**Your rules for the first 14 days:**
1. **Zero links.** Never mention RemodelerIQ.com in a Reddit comment.
2. **No founder origin sentence** until day 14+.
3. **Pure helpful advice.** You're building karma.
4. **2 comments per posting day.** Not 5. Not 10. Two.
5. **Different subreddits per comment.** Don't blast one sub.

**For each comment:**
1. On the dashboard, click the draft card
2. Read the post excerpt + source URL — open the source URL in a new tab to verify the question is still active
3. If the post has 50+ comments already, kill it — too late
4. If the post is unanswered or has under 10 comments, copy the Reddit draft
5. **STRIP the RemodelerIQ.com mention** if present (Phase 1 rule)
6. Paste into Reddit, post
7. Back on dashboard: paste the Reddit URL of your posted comment, click Mark Published
8. **Wait 90 minutes before your next Reddit comment** (auto-mod throttle protection)

### Nextdoor posting protocol

Nextdoor is more permissive than Reddit. Phase 1 rules:
1. RemodelerIQ.com mentions OK — soft, never as the lead
2. 1 business post per posting day MAX (algorithm penalty otherwise)
3. Reply to neighbor questions any time — quality > quantity
4. **Your first Nextdoor post ever** should be the warmup intro post (below)

### First Nextdoor post (one-time, Friday or Saturday)

Copy and post once to your Shallowford Park feed:

> Hey neighbors — Gustavo here, lifelong Atlanta-area homeowner. I started getting renovation quotes last year and was honestly shocked by how much they varied for the same scope. Built a tool to sanity-check contractor bids against real labor and material data — figured I'd share it in case it helps anyone else here who's about to sign a contract. It's at RemodelerIQ.com, first 3 bids are free. Happy to answer questions about Atlanta contractor norms any time.

After this post, your other Nextdoor activity = replies to neighbor questions only for week 1.

---

## What to do when Reddit auto-mod flags you

**Symptom:** Your comment appears to post, but nobody can see it. Or it says "removed by reddit's filters."

**Causes:**
- Account too new (<30 days)
- Comment too long
- Too many comments too fast (>1/30min on a single sub)
- URL in the comment (Phase 1 violation if you forgot to strip)
- Repetitive language across comments (auto-detected as bot pattern)

**Recovery:**
1. Wait 24 hours
2. Comment on 2–3 OTHER unrelated posts (not bid questions) to look human
3. If you got specifically banned from a sub, message the mods politely — explain you're a homeowner advocate, not a marketer
4. Worst case: pivot to a new account after 30 days

**The shadowban check:** Sign out of Reddit, open an incognito tab, navigate directly to your comment URL. If you can't see your comment when signed out, you're shadowbanned. Stop posting from that account.

---

## Voice troubleshooting

The swarm drafts replies via Gemini using your canonical voice spec. If a draft comes back wrong:

| Symptom | What to write in the Edit notes |
|---|---|
| Too wordy | "Cut 30%, keep the data hook" |
| Too pitchy | "Remove RemodelerIQ.com mention, let the profile do the work" |
| Voice off | "More 'experienced friend', less 'industry expert'" |
| Missing data | "Add specific labor or material range from the analyzer logic" |
| Cliché | "Cut the cliché phrase, replace with concrete number" |

The swarm reads these as guardrail signals and learns. By cycle 6+ you should rarely need to edit.

---

## Engagement tracking (auto)

When you Mark Published with a Reddit URL, the engagement tracker polls that URL every 12 hours and updates the draft's notes with upvote/comment counts. Format:

```
[metric 2026-05-31 08:24] ups=14 comments=3
[metric 2026-05-31 20:24] ups=22 comments=5
[metric 2026-06-01 08:24] ups=24 comments=6
```

**Use this to figure out which voice patterns work.**
- Drafts that hit 20+ upvotes by day 2 = voice pattern is winning. Reinforce it.
- Drafts that get 0–3 upvotes = voice pattern isn't landing. Edit pattern.
- Drafts that get downvoted = ban risk. Kill them from the dashboard with kill reason.

---

## Reddit OAuth setup (when ready to enable auto-scout)

Currently the Reddit Scout cron is in place but Reddit blocks unauthenticated server requests. To enable the auto-scout:

1. Go to https://www.reddit.com/prefs/apps
2. Click "create another app..." (at bottom)
3. Fill in:
   - Name: `RemodelerIQ Scout`
   - Type: **script**
   - Redirect URI: `https://remodeleriq.com/api/auth/callback/reddit`
4. After creation, you'll see a `client_id` (under the app name) and a `secret`
5. Add as Cloudflare secrets:
   ```
   npx wrangler secret put REDDIT_CLIENT_ID
   npx wrangler secret put REDDIT_CLIENT_SECRET
   npx wrangler secret put REDDIT_USER_AGENT
   ```
   The user agent format: `web:com.remodeleriq.scout:1.0 (by /u/YOUR_REDDIT_USERNAME)`
6. The Scout will pick up the credentials on next cron fire and start populating queued source posts automatically

Until OAuth is set up, the Scout silently returns 0 — drafts come from the manual seed only.

---

## Weekly metrics to track

Open the dashboard each Sunday and write down:

| Metric | Where to find it | Target Wk 2 |
|---|---|---|
| Drafts approved | Approved column count | 14+ |
| Drafts published | Published column count | 12+ |
| Avg upvotes per Reddit comment | Engagement notes on cards | 8+ |
| Kill count (signals voice drift) | Filter status=killed | <3 |
| Nextdoor neighbor thank-yous | Manual count from Nextdoor | 5+ |
| Reddit karma (your account total) | Top-right of reddit.com profile | 150+ |
| RemodelerIQ.com analyzer signups | /admin (main stats) | +5 |

---

## What to do if everything is fine

Boring is good. The system is built to run quietly for weeks. If you don't have urgent issues:

- Tue/Thu/Sat — 30 minutes reviewing drafts and posting
- Sunday — 15 minutes reviewing metrics + adjusting voice if needed
- Friday — write down what you learned this week, share with no one or share with everyone

The compounding starts at week 3. Don't quit before week 3.

---

## What to do if the dashboard shows 0 in_review drafts

This means either:
1. Scout hasn't queued anything (Reddit OAuth not set up — expected for now)
2. The Gemini API key is misconfigured (unlikely, just deployed and tested)
3. The cron didn't fire (check Cloudflare dashboard → Workers → Triggers)

**Quick fix:** click "Request new drafts" on the dashboard. It triggers a manual Scout + Cycle. If Scout returns 0 (Reddit blocked), seed manually with `scripts/seed-overnight-sources.sql` pattern.

---

## Phase progression

| Phase | Weeks | What changes |
|---|---|---|
| Phase 1 | 1–2 | Zero links, 7 Reddit comments/wk, 4 Nextdoor touches/wk |
| Phase 2 | 3–4 | Light CTA at 1 of 5, 1 original Reddit post/wk, 2 Nextdoor business posts/wk |
| Phase 3 | 5+ | Full engine, 15 Reddit comments/wk, 1 original post/wk, 2-3 CTA mentions/wk |

You advance to the next phase when:
- Phase 1 → 2: 100+ Reddit comment karma, no shadowbans, 5+ Nextdoor thank-yous
- Phase 2 → 3: 250+ karma, 1 Reddit post hit 50+ upvotes, regular Nextdoor engagement

Don't rush the phases. The compounding is patient.
