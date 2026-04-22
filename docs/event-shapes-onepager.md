# Event Shapes — The One-Pager

**Audience:** Happenlist admins (you, Hazel, future editors). Keep this open while adding events.
**Purpose:** Answer one question: *what kind of event am I looking at, and how do I enter it?*
**Last updated:** 2026-04-22

---

## The three shapes

Every event in Happenlist is one of three shapes. Pick the shape **before** you start filling in fields — the shape determines where it lives in the UI, whether it shows on the main feed, and how the admin form behaves.

> "Ongoing" (happy hour, exhibits, always-around things) is **not a separate shape**. It's just a Single with a wide date range plus weekly `hours` (e.g. "Open Tue–Fri 5–7pm").

### 1. Single

> One event with a date (or date range). If it has regular weekly hours, set the `hours` field.

Examples: a Saturday concert, a one-off pop-up, a museum exhibit Oct–Feb (wide date range + hours), Friday happy hour (wide date range + hours), semester-long open studio.

- **Enter as:** New event → Single
- **Feed:** Main feed ✅
- **Landing page:** Its own event page (displays hours if set)
- **DB shape:** plain `events` row, no `series_id`, no `parent_event_id`. Optional `hours` JSONB for weekly availability.

### 2. Recurring

> The **same event**, repeating on a schedule. If a user went last week, they don't need to go again — it's the same thing.

Examples: weekly storytime, monthly museum free day, Tuesday trivia, a yoga class that meets every Wednesday, an identical theatre run (same show 8 nights).

- **Enter as:** New event → Recurring
- **Feed:** Main feed ✅ — **collapsed** to next upcoming date + "28 more dates"
- **Landing page:** The recurring event's page; shows next date + upcoming schedule
- **DB shape:** `series` row + N `events` rows sharing `series_id`

### 3. Collection

> An **umbrella** with distinct sub-events. Each child is its own thing with its own lineup, opponent, or performer. The umbrella deserves its own landing page.

Examples: Summerfest (acts), Brewers home season (games), Bastille Days, multi-night theatre run with variable cast, a lecture series where each talk is a different speaker.

- **Enter as:** New event → Festival / Season / Umbrella *(UI TBD — currently must be built via scraper or DB)*
- **Feed:** Parent appears on main feed ✅; children are **hidden** from main feed
- **Landing page:** Parent page shows children as a schedule; clicking a child goes to its own page with breadcrumb back to parent
- **DB shape:** parent `events` row; children `events` rows with `parent_event_id` pointing at parent

---

## The decision tree

```
Is each date a distinct lineup / opponent / content, with its own landing page?
├── Yes → COLLECTION (umbrella + children)
└── No
    ├── Does the same thing repeat on a schedule (and instances are interchangeable)?
    │   ├── Yes → RECURRING (collapsed to next date)
    │   └── No → SINGLE
    │       (If always-around like happy hour or an exhibit,
    │        set a wide date range + weekly hours)
```

---

## Quick-check table

| I'm entering... | Shape | Extra fields | Parent/child? |
|---|---|---|---|
| Concert Saturday night | Single | — | No |
| Weekly storytime | Recurring | recurrence_rule | No |
| A class that meets 8 weeks | Recurring | recurrence_rule | No |
| Hamilton, 8 identical shows | Recurring | recurrence_rule | No |
| Hamilton, different cast each night | Collection | — | Yes |
| Summerfest | Collection | — | Yes |
| Brewers 2026 home season | Collection | — | Yes |
| Summerfest returning next year | Collection | `prior_edition_event_id` on new parent | Yes |
| Summer camp (one enrollment, 5 days) | Single | start + end date | No |
| Happy hour every Friday | Single | wide date range + `hours` | No |
| Museum exhibit Oct–Feb | Single | Oct–Feb range + `hours` | No |
| Monthly museum free day | Recurring | recurrence_rule (monthly) | No |
| Brunch special, every Sunday forever | Single | wide range + `hours` (Sun only) | No |

---

## Common traps

**1. "It's a series" — which kind?**
"Series" is overloaded. If instances are **the same thing**, it's a Recurrence. If instances are **different things under one umbrella**, it's a Collection. If it's **always just kinda there**, it's Ongoing.

**2. Season ≠ recurrence.**
A Brewers season isn't "one game repeating." Each game is a distinct event with a different opponent. That's a Collection — parent/child with a landing page. The fact that we have a `season` series_type doesn't change this.

**3. Camps are one event, not many.**
A 5-day kids camp is a single enrollment, a single decision. Enter it as a Single event with a date range, not five daily rows.

**4. Recurring ≠ every date shows in the feed.**
Recurrence **collapses**. The main feed shows the next upcoming instance with "28 more dates." This is intentional — spamming 28 identical cards into the feed is noise.

**5. Ongoing stays off the main feed.**
Happy hour and exhibits don't belong in the "what should I do Saturday" feed. They have their own home at `/events/lifestyle`.

**6. Festival acts don't show on main feed.**
When you build Summerfest as a Collection, each act is hidden from the main feed — they appear on the Summerfest landing page. The main feed shows *Summerfest*, not 200 individual performance cards.

---

## What the admin UI should let you do (current vs. gaps)

| Action | Status today |
|---|---|
| Create a Single event | ✅ Works |
| Create a Recurrence (via "Make Recurring" button on an event) | ✅ Works, but flow is inverted — you create the first event, then mark it recurring |
| Create a Collection parent + children | ❌ **Gap** — must use scraper or DB. No admin form |
| Convert a Single into a Recurrence | ✅ via "Make Recurring" |
| Convert flat `season` events to a proper Collection | ❌ Gap |
| Edit a Recurrence schedule (add/remove dates) | ✅ via `/admin/series/[id]/edit` → RegenerateDatesPanel |
| Skip one instance (EXDATE — "cancel this week only") | ❌ Gap |
| Override one instance (different title this Tuesday) | ❌ Gap |
| Import preview tells me which shape was detected | ❌ Gap — import preview treats everything as Single |
| See orphan events, broken series, childless parents | ✅ `/admin/worklists` |

This gap list feeds the admin redesign plan — see CLAUDE.md "Known debt" section.

---

## Data audit status

As of 2026-04-22: **audit not yet run.** Expected miscategorizations:

- Some `season` events entered as flat (no parent) — should be Collections
- Some `exhibit`/`ongoing` events that could be simplified to Single-with-date-range
- `camp` series that should be single events
- Missing `recurrence_rule` on events that were `series_type = recurring` but never got a rule set

Results will land at `docs/phase-reports/event-shapes-audit-YYYY-MM-DD.md`.
