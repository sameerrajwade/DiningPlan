# Sofra — Video Prompts (App Walkthrough + 3-Culture Brand Commercials)

Tool-agnostic prompts (Veo 3 / Runway Gen-3 / Sora / Kling). Brand: terracotta `#C0532E`,
sage `#5E8B6A`, warm paper `#FBF7F2`; fonts Fraunces (display) + Inter (body); tagline
**"Plan meals, remember it all."** (alt: "Your family's meal memory"); site sofra.savvylabs.dev.

## THE ONE RULE (read first)
**Never let an AI video generator draw the app UI, the Sofra logo, or any readable on-screen
text — it will garble them.** In every human/lifestyle shot, keep the phone **angled, off, or
softly blurred**. Generate clean base footage, then **composite the real assets in post**:
- Real app screens: `docs/assets/screens/*.png` (or a live screen recording — the gold standard).
- Logo end-card: `assets/brand/marketing/sofra_lockup.png` on cream + tagline + Google Play badge (~2s).
- All brand supers/captions: add in editing (CapCut / Premiere / After Effects), not in the generator.

Deliver **9:16 1080×1920** as primary (Shorts/Reels), with a 16:9 cutdown for YouTube.

---

# PART A — App Walkthrough / Product Demo (~50–55s)

**Method:** this is a **motion-graphics composite of your real screen PNGs**, not AI-invented UI.
Best: screen-record the live app on a demo/generic account. No device? Composite the PNGs below
inside a phone frame with subtle motion. The AI/compositing tool only adds a device frame, gentle
motion, and captions — it must **not** repaint the screen.

### Voiceover script (English — ~55s)
1. "Meet Sofra — your family's meal memory."
2. "Sign up in seconds…"
3. "…then create your household, or join your family's with a code. One shared kitchen, everyone in sync."
4. "Your home screen shows what you've cooked — and gently reminds you of dishes you haven't made in a while."
5. "Log a meal in seconds: pick the dish, rate it, done."
6. "Insights show how often you cook at home versus eat out — and where the money really goes."
7. "Remember every restaurant — the dishes you loved, and the stars you gave them."
8. "Make it yours — update your name, photo, and household anytime."
9. (end-card) "Sofra. Plan meals, remember it all."

### Scene map
| # | Time | Journey step | Screen asset | Motion | Lower-third caption |
|---|------|--------------|--------------|--------|---------------------|
| 1 | 0–5s | Login | `login.png` | slow push-in, fade up | Welcome to Sofra |
| 2 | 5–11s | Register | `login.png` (→ sign-up state) | field-focus glows | Sign up in seconds |
| 3 | 11–18s | Household join | `household.png` | animated code entry / tap | One shared kitchen |
| 4 | 18–25s | Home | `home.png` | gentle scroll of the list | What you've cooked |
| 5 | 25–32s | Add meal | `addmeal.png` | tap "+", pick dish, tap stars | Logged in seconds |
| 6 | 32–40s | Insights | `insights.png` | bars grow, count up | Home vs. eating out |
| 7 | 40–46s | Restaurant insights | **`restaurant.png` (TO CREATE)** | reveal dish rows + stars | Order like a regular |
| 8 | 46–52s | Profile / settings | **`profile.png` (TO CREATE)** | toggle/edit tap | Make it yours |
| — | 52–55s | End-card | `sofra_lockup.png` | logo settle | Plan meals, remember it all |

> **Asset gap:** scenes 7 & 8 need two new generic screens (restaurant-detail with dishes+stars,
> profile/settings). These can be rendered from new `shot_restaurant.html` / `shot_profile.html`
> mirroring the existing screen mockups (Rivera Family data), same Chrome-headless → PNG pipeline.

### Per-scene compositing prompt (template)
```
Vertical 9:16 product-demo shot. Place the SUPPLIED image [screen].png inside a clean modern
smartphone frame, centered on a warm cream (#FBF7F2) background with a soft terracotta-to-sage
gradient glow and a gentle drop shadow. IMPORTANT: do not alter, redraw, recolor, or add any text
to the phone screen — keep the supplied UI pixel-exact. Add subtle motion only: [slow 5% push-in /
a fingertip tap ripple on the + button / a slow upward scroll of the list / stars filling one by
one]. Calm, premium, minimal. Soft focus falloff at edges. Duration [n] seconds, 30fps.
```
Add captions and voiceover in the editor (Fraunces, terracotta, lower third). Transitions: a gentle
left push that follows the user's journey; hold each screen ~1s before moving.

---

# PART B — Brand Commercials (3 cultural variants, ~24s each)

Same emotional arc — *"the meals a family loves but slowly forgets; Sofra remembers them"* —
localized in cast, home, food, wardrobe, and **spoken language**. Real homes, real everyday food,
no gloss. Warm acoustic music, low. Leave a clean **2s "phone-in-hand" beat** (screen angled away)
where the real Sofra screen is composited in post. End-card + tagline added in post, in-language.

> Audio note: Veo 3 can speak the line natively, but AI TTS accents (esp. Hindi/Marathi) can be
> off — plan to **re-record the VO cleanly** with a native speaker and lip-sync/voice-over in post.

---

## B1 — American family · English audio
```
Cinematic 9:16, 24s, warm and honest (not techy). A relaxed suburban family — mid-30s parents and
two kids (~7 and ~10) — in a bright open-plan kitchen: wood island, subway tile, herbs on the sill,
big windows with golden-hour light. Wardrobe: soft neutrals, denim, knitwear. Food on the counter:
roast chicken, a fresh salad, a pot of pasta — real, homey.
Beats: 0–6s a parent opens the fridge, pauses, thinking "what do we make tonight?"; 7–12s glances at
a phone held low and angled away from camera (screen NOT visible), small knowing smile; 13–18s
family drifts into easy cooking together, kid steals a bite, laughter; 19–22s they sit to eat,
warm and unhurried; 22–24s clean beat on the table for the end-card.
Camera: gentle handheld, shallow depth of field, soft warm grade. Music: warm acoustic, gentle.
Audio (American English, warm female VO): "Every family has a hundred little meals they love — and
slowly forget. Sofra remembers them all, so the ones that matter never get lost."
Do NOT show any phone screen content, app UI, logos, or on-screen text (added in post).
```
- **On-screen (post):** super "Plan meals, remember it all." · end-card: Sofra lockup + Google Play badge.
- **Negative:** fake app UI, readable phone screen, glossy studio food, stock-ad vibe, text artifacts, distorted hands/faces.

---

## B2 — North-Indian "desi" family · Hindi audio
```
Cinematic 9:16, 24s, warm and heartfelt. A lively North-Indian joint family — young parents, two
kids, and a grandmother (dadi) — in a cozy Indian home kitchen: stainless-steel utensils, a masala
dabba, a pressure cooker, warm earthy tones, a small shelf with a diya. Wardrobe: mother in a
cotton kurti or saree, dadi in a soft saree, kids in home clothes; one child with a steel tiffin.
Food: rajma-chawal, dal, fresh roti puffing on the tawa, a simple sabzi — everyday home cooking.
Beats: 0–6s dadi and mother cooking, easy chatter, steam rising; 7–12s mother glances at a phone
held low, angled away (screen NOT visible), a warm "haan, yeh banate hain" nod; 13–18s the family
gathers, kids reach for food, laughter, dadi serves; 19–22s everyone eating together on the floor
or at the table; 22–24s clean beat for the end-card.
Camera: gentle handheld, shallow depth of field, warm golden grade. Music: soft acoustic with a
subtle Indian touch.
Audio (Hindi, warm female VO): "हर घर में माँ के हाथ का एक ऐसा खाना होता है, जो सबको याद रहता है…
और कुछ ऐसे भी, जो धीरे-धीरे भूल जाते हैं। Sofra हर स्वाद को याद रखता है — ताकि आपका परिवार उसे कभी न भूले।"
(Transliteration: "Har ghar mein maa ke haath ka ek aisa khaana hota hai, jo sabko yaad rehta hai…
aur kuch aise bhi, jo dheere-dheere bhool jaate hain. Sofra har swaad ko yaad rakhta hai — taaki
aapka parivaar use kabhi na bhoole.")
Do NOT show any phone screen content, app UI, logos, or on-screen text (added in post).
```
- **On-screen (post):** super "खाना प्लान करें, यादें सँभालें।" (Khaana plan karein, yaadein sambhaalein.) · end-card: Sofra lockup + Play badge.
- **Negative:** fake app UI, readable phone screen, stereotyped/exaggerated costumes, glossy food, text artifacts, distorted hands/faces.

---

## B3 — Maharashtrian family · Marathi audio
```
Cinematic 9:16, 24s, warm and rooted. A Maharashtrian family — parents, a school-age child, and a
grandmother (aaji) — in a traditional home kitchen: brass and steel vessels, a warm wooden setting,
soft daylight. Wardrobe: aaji in a cotton/nauvari saree, mother in a simple cotton saree or kurta,
child in a school uniform with a steel dabba. Food: varan-bhaat topped with a spoon of toop (ghee),
poli-bhaji, a plate of thalipeeth — honest everyday Maharashtrian home food.
Beats: 0–6s aaji and mother cooking together, gentle steam, quiet warmth; 7–12s mother checks a
phone held low, angled away (screen NOT visible), a soft "hoy, hech karuya" smile; 13–18s family
gathers for the meal, child served first, easy laughter; 19–22s eating together, content; 22–24s
clean beat for the end-card.
Camera: gentle handheld, shallow depth of field, warm natural grade. Music: soft acoustic, tender.
Audio (Marathi, warm female VO): "प्रत्येक घरात आईच्या हातचं एक खास जेवण असतं — जे सगळ्यांना आठवतं…
आणि काही असंही, जे हळूहळू विसरलं जातं. Sofra प्रत्येक चव लक्षात ठेवतं — म्हणजे तुमचं कुटुंब ती कधीच विसरणार नाही."
(Transliteration: "Pratyek gharat aaईchya haatcha ek khaas jevan asta — je saglyanna aathavta…
aani kaahi asahi, je haluhalu visarla jata. Sofra pratyek chav lakshat thevta — mhanaje tumcha
kutumb ti kadhich visarnaar naahi.")
Do NOT show any phone screen content, app UI, logos, or on-screen text (added in post).
```
- **On-screen (post):** super "जेवण ठरवा, आठवणी जपा." (Jevan tharava, aathavani japa.) · end-card: Sofra lockup + Play badge.
- **Negative:** fake app UI, readable phone screen, stereotyped costumes, glossy food, text artifacts, distorted hands/faces.

---

## Shared production checklist
- Shoot/generate 9:16 1080×1920; keep a 16:9 cutdown in mind.
- Every phone in frame = angled/off/blurred; composite the real Sofra screen (`docs/assets/screens/*.png`)
  or a live screen-recording in post.
- Consistent end-card across all three: `sofra_lockup.png` on cream + in-language tagline + Google
  Play badge, held ~2s.
- Re-record VO with native Hindi/Marathi speakers for clean pronunciation; don't rely on AI TTS.
- Food styling: real home food (roast/pasta/salad · rajma-chawal/dal/roti · varan-bhaat/poli-bhaji/thalipeeth).
