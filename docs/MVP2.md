# Sofra — MVP2 Backlog

Ideas intentionally deferred past the first launch. Captured so they aren't lost.

## Relative-date labels — larger units
`src/utils/relativeDate.ts` currently returns Today / Yesterday / "N days ago". For large
gaps (the "haven't made in a while" list, stale dishes), extend to friendlier units:
- 7–13 days → "1 week ago", 14–20 → "2 weeks ago", …
- 30+ days → "1 month ago", "2 months ago", …
Keep the exact day count available on the rotation views if it reads better there. Decision
deferred: exact day counts are arguably more useful for rotation than fuzzy "last month".

## Combined home + outside dish view
As of launch, "dishes" mean **home-cooked only** — the Dish Library, Home "Unique Dishes", and
Insights "most cooked" all exclude dine-out/takeout. Restaurant-ordered dishes live only in the
restaurant detail screen. MVP2: add an optional **filter/toggle** in the Dish Library to also show
dishes you've ordered out (clearly labelled as such), rather than mixing them into the home counts.
Do it as a separate view, never by folding outside dishes back into the home metrics.

## Notification deep-linking (carried over)
Tapping a daily reminder should open a focused "tomorrow's menu" card, not the generic Home; weekly/
monthly reminders should open the specific insight card. Needs a notification `data` payload + a
nav handler. (Also tracked in the prioritized backlog.)

---
_Add new deferred ideas here as they come up during launch prep._
