# Sofra Launch Video — AI hand-off package

Give this file + the referenced media to your video AI tool. It contains everything needed to
produce the final 30–32s launch video. **Two family versions** (Western + Indian), same structure.

## What's already done for you (do NOT regenerate)
- **Beats 2 & 3 (the app demo) are PRE-RENDERED finished video clips.** Drop them straight into the
  timeline — no need to recreate app screens.
  - Western: `branding/assets/video/clips/western/app_demo.mp4`
  - Indian:  `branding/assets/video/clips/indian/app_demo.mp4`
  - (If your tool wants stills instead of a clip: `branding/assets/video/stills/<family>/{plan,restaurant,insights}.png`)
- **End card:** `branding/assets/end-cards/sofra_endcard_9x16.png`

## What the AI tool must generate
Only the **human footage** for Beat 1 and Beat 4 (no app, no phone, no UI, no text — see rule below),
then **stitch the timeline** in the order given.

---

## ⛔ ABSOLUTE RULE
Generate ONLY human / kitchen / dining footage. **Never draw or animate a phone screen, app UI,
logo, chart, icon, or text.** The app is supplied as finished clips. If a phone appears in a human
shot, it must be blank/off.

---

## Final timeline (per family)

| # | Source | Duration | On screen | Caption (burn in, sound-off) |
|---|--------|----------|-----------|------------------------------|
| Beat 1 | **generate** | 6s | Parent at open fridge, 6pm, "what do I make?" blank | **What's for dinner?** |
| Beat 2+3 | **`app_demo.mp4`** (done) | ~17s | Sofra: one-tap plan → dishes+ratings → home-vs-out | *(captions already baked in)* |
| Beat 4 | **generate** | 6s | Same family, calm, eating together, warm | **Dinner, sorted.** |
| End card | **`sofra_endcard_9x16.png`** | 2s | Sofra logo + "Free on iOS & Android" + website | — |

Export **9:16** (1080×1920) primary; also a 1:1 crop for feed. Keep captions centered/safe.

---

## Beat 1 prompt (generate) — "the pain"

**Western:**
```
Photorealistic 6s vertical (9:16) home video, early evening warm light. A tired woman mid-30s
stands at an open refrigerator, hand on the door, staring blankly, unsure what to cook. A child
drifts in asking something off-camera. Relatable end-of-day "what do I make?" fatigue — not sad.
Handheld, shallow depth of field, natural window light, cozy modern Western kitchen.
NO phone, NO screen, NO on-screen text, NO logo.
Negative: phone, app, screen, UI, text, captions, logo, watermark, distorted hands.
```
**Indian:**
```
Photorealistic 6s vertical (9:16) home video, early evening warm light. A tired woman mid-30s in a
modern Indian home stands at the counter by open steel dabbas / fridge, unsure what to cook; a child
peeks in asking "Mumma, khaane mein kya hai?" off-camera. Relatable "what do I make tonight?" blank.
Handheld, shallow DOF, natural light, contemporary Indian kitchen (steel containers, pressure cooker).
NO phone, NO screen, NO on-screen text, NO logo.
Negative: phone, app, screen, UI, text, captions, logo, watermark, distorted hands.
```

## Beat 4 prompt (generate) — "the payoff"

**Western:**
```
Photorealistic 6s vertical (9:16) home video, warm dinner glow. The same family relaxed around the
table sharing a home-cooked meal, easy smiles, a parent setting down the last dish. Calm, "sorted"
mood. Golden light, handheld, natural. NO phone, NO screen, NO text, NO logo.
Negative: phone, screen, UI, text, logo, watermark, distorted hands, clutter.
```
**Indian:**
```
Photorealistic 6s vertical (9:16) home video, warm dinner glow. The same Indian family relaxed around
the table sharing a simple home dinner (roti, dal, sabzi in steel serveware), easy smiles, a child or
grandparent reaching for a helping. Calm, "sorted" warmth. Golden light, handheld, natural.
NO phone, NO screen, NO text, NO logo.
Negative: phone, screen, UI, text, logo, watermark, distorted hands, clutter.
```

---

## Optional voiceover (video works silent)
- **Western (English):** "Every night, the same question. What's for dinner? Sofra answers it in one
  tap — because it remembers what your family actually loves. Dinner, sorted. Sofra — free on iOS and Android."
- **Indian (Hindi, use a NATIVE speaker — no AI Hindi TTS):** "हर शाम वही सवाल — आज खाने में क्या बनाऊँ?
  सोफ़्रा एक टैप में जवाब देता है — क्योंकि उसे याद रहता है आपके परिवार को क्या पसंद है। खाना — सॉर्टेड।
  सोफ़्रा — iOS और Android पर मुफ़्त।"

## Notes
- End-card store pills are Sofra-styled placeholders — swap official Apple/Google badges for public/paid use.
- Website on end card: https://sofra.savvylabs.dev
- Full production detail (if needed): `branding/prompts/launch-video-demo-led.md`
