# Sofra — Launch Video (demo-led) · production prompts

**Concept (agreed 2026-08-06):** NOT a TV brand film. A demo-led launch video that shows the
real problem → the app solving it → the payoff. Same 30–32s master, cut into **two family versions**
(Western + Indian) so it lands with both crowds, and re-cut for **friends/family texts** and **Instagram**.

**The one idea the whole video sells:**
> Sofra answers *"what's for dinner?"* in one tap — **because it remembers what your family loves.**
The instant answer is the hook; "because it remembers" is the reason it's true (and why people keep it).

---

## ⛔ THE HARD RULE FOR ANY AI VIDEO TOOL (Veo / LTX Studio / Flow / Runway)

> **Generate ONLY the human, kitchen, and table footage (Beats 1 & 4).
> Do NOT draw, invent, animate, or imagine any phone screen, app interface, UI, logo, text, chart,
> or icon. Every app screen is a supplied real PNG, composited in post.**

Beats 2 & 3 (the app) are **real screen PNGs / screen recordings** — never AI-generated. If a phone
appears in a human shot, film it with a **green/blank screen** so the real UI is keyed in later.

---

## Master arc (both families, both channels)

| Beat | Time | What's on screen | Asset | Sound-off caption |
|------|------|------------------|-------|-------------------|
| 1 · Pain | 0–6s | AI footage: parent at the open fridge / empty counter, 6pm, mild defeat | *generated* | **"What's for dinner?"** — the question you lose every night. |
| 2 · One tap | 6–13s | Real screen-rec: open Sofra → tap **Plan your week** → week fills | `plan.png` (+ `home.png`) | **One tap. Sorted.** |
| 3 · The "because" | 13–24s | Real screens: dishes-you've-had + ratings → Home-vs-Outside | `restaurant.png` → `insights.png` | **Because Sofra remembers what your family loves.** |
| 4 · Payoff + CTA | 24–32s | AI footage: same family, calm, eating together, warm → end card | *generated* → `sofra_endcard` | **Dinner, sorted. Sofra — free.** |

**Which screen folder per cut:**
- Western cut → `branding/assets/screens/*.png`
- Indian cut → `branding/assets/screens/indian/*.png`

---

## Beat 1 — "The pain" (AI footage prompt)

Duration ~6s · vertical 9:16 (master) · warm domestic realism · **no phone, no UI, no text.**

### Western family
```
A photorealistic 6-second vertical (9:16) home video. Early evening, warm kitchen light.
A tired woman in her mid-30s stands in front of an open refrigerator, one hand on the door,
staring blankly at the shelves. Behind her a kid drifts in and asks something off-camera.
Subtle, relatable end-of-day fatigue — not sad, just the daily "what do I make?" blank.
Handheld, shallow depth of field, natural window light, cozy modern Western kitchen.
No phone in frame, no screens, no on-screen text, no logos.
```
Negative: `phone, smartphone, app, screen, UI, text, captions, logo, watermark, cartoon, distorted hands`

### Indian family
```
A photorealistic 6-second vertical (9:16) home video. Early evening, warm kitchen light.
A tired woman in her mid-30s in a modern Indian home stands at the kitchen counter beside
open steel dabbas / an open fridge, looking unsure what to cook. A child peeks in asking
"Mumma, khaane mein kya hai?" off-camera. Relatable end-of-day "what do I make tonight?" blank.
Handheld, shallow depth of field, natural light, contemporary Indian kitchen (steel containers,
pressure cooker on the stove). No phone in frame, no screens, no on-screen text, no logos.
```
Negative: `phone, smartphone, app, screen, UI, text, captions, logo, watermark, cartoon, distorted hands`

---

## Beat 4 — "The payoff" (AI footage prompt)

Duration ~6s · vertical 9:16 · warm, resolved, golden · **no phone, no UI, no text** (end card added in post).

### Western family
```
A photorealistic 6-second vertical (9:16) home video. Warm dinner-time glow. The same family
now relaxed around the dining table, sharing a home-cooked meal, easy smiles and light
conversation, a parent setting down the last dish. Calm, unhurried, "sorted" mood.
Golden warm light, handheld, natural. No phone in frame, no screens, no on-screen text, no logos.
```

### Indian family
```
A photorealistic 6-second vertical (9:16) home video. Warm dinner-time glow. The same Indian
family now relaxed around the table sharing a simple home-cooked dinner (roti, dal, sabzi in
steel serveware), easy smiles, a grandparent or child reaching for a helping. Calm, "sorted"
end-of-day warmth. Golden light, handheld, natural.
No phone in frame, no screens, no on-screen text, no logos.
```
Negative (both): `phone, screen, UI, text, logo, watermark, cartoon, distorted hands, messy clutter`

---

## Beats 2 & 3 — the app (NO generation — composite real screens)

Two ways to produce, pick one:
- **A. Real screen recording (best):** record the actual app on a phone doing exactly this flow —
  open Plan → tap generate → week fills → open a Restaurant (Sagar Ratna / Nonna's) → open Insights.
  Use the Sharma-family data for the Indian cut, Rivera for Western.
- **B. Static PNG "motion" (fastest, no build needed):** animate the supplied PNGs — a phone frame
  with `plan.png` sliding up, a finger-tap graphic on "Plan your week," a quick push-transition to
  `restaurant.png` then `insights.png`. Ken-Burns / slide, ~2s per screen.

**Beat 2 screens:** `plan.png` (the auto-planner filling the week) — lead here since it *is* the one-tap.
**Beat 3 screens:** `restaurant.png` (Dishes you've had + star ratings = the memory) → `insights.png`
(Home vs Outside + cuisine mix = the dine-out insight). These two are the "because it remembers" proof.

---

## Captions (sound-off first — burn into the video)

Both cuts use the same four lines. Timing = one line per beat.

1. **What's for dinner?** *(smaller sub, fades)* the question you lose every night.
2. **One tap. Sorted.**
3. **It remembers what your family loves.**
4. **Dinner, sorted.** → end card: **Sofra · Free on iOS & Android**

Instagram cut: keep captions large, high-contrast, safe-area centered; hook caption (line 1) must
be on screen by 0:00 — no logo intro before it.

---

## Voiceover (optional — video works silent; add VO for YouTube / stories)

**English (Western cut):**
> "Every night, the same question. *What's for dinner?*
> Sofra answers it in one tap — because it remembers what your family actually loves.
> The dishes, the ratings, the nights you eat out. Dinner, sorted. **Sofra — free on iOS and Android.**"

**Hindi (Indian cut)** — *record with a native speaker; do NOT use AI Hindi/Marathi TTS (prior rule):*
> "हर शाम वही सवाल — *आज खाने में क्या बनाऊँ?*
> सोफ़्रा एक टैप में जवाब देता है — क्योंकि उसे याद रहता है आपके परिवार को क्या पसंद है।
> हर डिश, हर रेटिंग, हर बाहर खाने की शाम। खाना — सॉर्टेड। **सोफ़्रा — iOS और Android पर मुफ़्त।**"
>
> *(Transliteration for the artist: "Har shaam vahi sawaal — aaj khaane mein kya banaaun? Sofra ek
> tap mein jawaab deta hai — kyunki use yaad rehta hai aapke parivaar ko kya pasand hai. Har dish,
> har rating, har baahar khaane ki shaam. Khaana — sorted. Sofra — iOS aur Android par muft.")*

---

## Assembly / edit plan

1. Generate the 4 human clips (2 families × Beat 1 + Beat 4) at 9:16, ≥1080p.
2. Produce Beats 2 & 3 (screen-rec or animated PNGs) — Western + Indian variants.
3. Timeline per cut: Beat1 (6s) → Beat2 (7s) → Beat3 (11s) → Beat4 (6s) → hold end card (2s).
4. Burn sound-off captions; add VO track if used.
5. End card: `branding/assets/end-cards/sofra_endcard_9x16.png` (has Free-on-store pills + website).
   ⚠️ Pills are Sofra-styled placeholders — swap official Apple/Google badges for public store/paid use.
6. Export **9:16** (IG Reels / stories / WhatsApp) and a **16:9 or 1:1** crop (feed / YouTube) — keep
   captions inside the center safe area so both crops work.

## Deliverables checklist
- [ ] Western cut — 9:16 + 1:1
- [ ] Indian cut — 9:16 + 1:1
- [ ] Friends/family text version (personal opener frame optional: "The app I built to fix dinner 👇")
- [ ] Instagram version (hook caption at 0:00, no intro)
- [ ] Native-Hindi VO recorded (Indian cut)

## Asset paths
- Western screens: `branding/assets/screens/*.png`
- Indian screens: `branding/assets/screens/indian/*.png`
- End cards: `branding/assets/end-cards/sofra_endcard_9x16.png` / `_16x9.png`
- Website (on end card): https://sofra.savvylabs.dev
