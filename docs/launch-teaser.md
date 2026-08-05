# Sofra — Launch Teaser Kit (WhatsApp video + message)

Goal: a ~15s realistic, human-centric brand commercial for WhatsApp/Reels, ending on the Sofra
brand card + website, plus an invite message. Vertical **9:16**, target **4K**.

Palette: terracotta `#C0532E`, sage `#5E8B6A`, warm cream `#FBF7F2`. Fonts: Fraunces (display) + Inter.

---

## 1. How the 15s is built (recommended)

AI video can't reliably render your **real app UI** or **on-screen text/logos** — so:
- **Human/lifestyle footage** → generate with Veo 3 (text-to-video). Veo is excellent at real people.
- **The app on the phone** → either screen-record the real app and composite onto the phone in editing,
  OR cut to your branded screenshots as quick inserts. Do NOT ask Veo to draw the UI.
- **Brand end-card + website** → use the ready 4K PNG (`sofra_video_endcard_9x16_4k.png`). Overlay it in
  editing for the last ~2.5s. (Optionally animate it with the image-to-video prompt below.)

Timeline:
- **0–7s** — Clip A (Veo): the "what's for dinner?" moment → relief with phone.
- **7–12.5s** — Clip B (Veo): family cooking + eating together, warmth.
- **12.5–15s** — Brand end-card PNG (hold ~2.5s), website pill visible.
- App-screen insert (~1s) dropped over the "relief" beat in editing.

Veo 3 makes 8s clips at up to 1080p → generate both, stitch in CapCut/Premiere, then upscale to 4K
(Topaz Video AI or the tool's upscaler). The end-card PNG is already 4K.

---

## 2. Veo 3 prompt — CLIP A (text-to-video, 8s, 9:16)

> Cinematic, photorealistic vertical commercial, shot on 35mm, shallow depth of field. Golden-hour
> light spilling into a warm, lived-in family kitchen — natural wood, terracotta and sage tones, real
> everyday food on the counter. A relatable parent in their mid-30s stands at an open fridge, gently
> overwhelmed, exhales a soft "what do we even make tonight." They pick up a phone; a beat of calm
> relief softens their face and they reach for fresh ingredients with quiet confidence. Handheld,
> intimate camera with a slow push-in. Soft ambient kitchen sounds, no music. Authentic, warm, hopeful
> mood. Natural skin tones, realistic textures, film grain. No on-screen text, no logos, no captions.

Negative / avoid: `cartoon, animation, 3D render, CGI, text, watermark, logo, distorted hands, extra fingers, plastic skin, oversaturated`

## 3. Veo 3 prompt — CLIP B (text-to-video, 8s, 9:16)

> Cinematic, photorealistic vertical commercial, warm golden-hour kitchen. The same family now cooking
> together — a pan sizzles, a child sets the table, gentle laughter. Cut to everyone sitting down to a
> simple home-cooked meal, passing dishes, genuine smiles and connection. Soft, shallow depth of field,
> slow graceful camera moves, natural light, film grain, realistic textures and skin tones. Warm,
> heartfelt, family mood. Soft ambient room tone, no music. No on-screen text, no logos, no captions.

Negative / avoid: same as above.

## 4. (Optional) Veo 3 prompt — BRAND REVEAL (image-to-video)

Attach image: **`sofra_video_titlecard_9x16_4k.png`** (or the end-card). Prompt:

> Start from the attached brand card. Keep the composition perfectly still and centered. Gently animate
> soft steam rising from the bowl icon, a slow subtle push-in, and a warm light bloom washing across the
> cream background. Elegant, premium, minimal. No new text, keep all existing text crisp and unchanged.

Use this only if you want a moving logo sting; otherwise just hold the static PNG.

---

## 5. Which images to attach / use where

- **`sofra_video_endcard_9x16_4k.png`** — the end-card (icon + Sofra + tagline + website pill). Overlay
  for the final ~2.5s. This is the one carrying your link.
- **`sofra_video_titlecard_9x16_4k.png`** — same, without the URL pill. Use as an opener or for the
  image-to-video reveal.
- **App-screen inserts** (drop 1 into the "relief" beat, in editing — not into Veo):
  - `sofra_ios65_brand_hero.png` (hero), `sofra_ios_67_home.png`, `..._plan.png`, `..._insights.png`.
  All in `assets/brand/marketing/ios/`.

Music: add in edit — warm, gentle acoustic (fingerpicked guitar / soft piano). Keep it under the SFX.

---

## 5b. ONE combined 15s prompt (only if your tool allows >8s / Flow "extend")

Veo (Gemini app) is usually 8s per clip → prefer the 2-clip route above. Use this single prompt only in
Flow with a longer duration/extend. **No image attached** (text-to-video). It ends on a clean cream frame
so you overlay `sofra_video_endcard_9x16_4k.png` for the last ~2s.

> Cinematic, photorealistic vertical 9:16 brand commercial, 15 seconds, shot on 35mm, shallow depth of
> field, natural film grain. Warm golden-hour light in a lived-in family kitchen — natural wood, terracotta
> and sage tones, real everyday food. 0–5s: a relatable parent in their mid-30s stands at an open fridge,
> gently overwhelmed, softly sighs "what do we even make tonight?"; they glance at their phone and a wave
> of calm relief softens their face. 5–11s: a warm montage — reaching for fresh ingredients, a pan sizzles,
> a child sets the table, gentle laughter, the family gathering. 11–15s: the family sits down to a simple
> home-cooked meal, passing dishes, genuine smiles; camera slowly pushes in, then softly rack-focuses to a
> clean, empty warm-cream background — leave the final 2 seconds as a plain cream backdrop with no objects
> and no text. Intimate handheld camera, slow graceful moves, natural skin tones, realistic textures. Soft
> ambient kitchen room tone, no music. No on-screen text, no captions, no logos anywhere.

**Which image with which clip:** Clip A (§2) and Clip B (§3) = text-only, NO image. Clip C (§4) = attach
`sofra_video_titlecard_9x16_4k.png`. The combined prompt above = NO image.

## 6. WhatsApp / text message

**Short version**

> Okay — surprise 🎉 I've been quietly building something.
>
> Meet *Sofra* — a little app that helps families plan the week's meals and actually *remember* what you
> cook and love. No more "what's for dinner?" every single night.
>
> Take a peek 👉 https://sofra.savvylabs.dev
>
> Want in early? Just reply with your email and I'll add you as a beta tester this week. Or hold tight —
> it lands on the App Store in ~2 days 🚀
>
> Would genuinely love your feedback ❤️

**Warmer version**

> So… I have a small confession — for a while now I've been building an app for my own family, and it's
> finally real. 🎉
>
> It's called *Sofra*. It helps you plan the week's meals, log what you cook (home, takeout, dining out),
> rate dishes, and it quietly remembers your family's favourites so dinner stops being a daily guessing
> game.
>
> Have a look: https://sofra.savvylabs.dev
>
> Two ways to jump in:
> • **Be a beta tester now** — reply with your email and I'll add you this week.
> • **Wait ~2 days** for the full App Store launch.
>
> Your honest feedback would mean a lot 🙏

---

## 7. Practical: onboarding the beta emails (iOS TestFlight)

Easiest path for friends = **TestFlight external testing** (up to 10,000 by email or a public link):
1. App Store Connect → your app → **TestFlight** → create an **External** group.
2. Add the collected emails (or enable the **Public Link** and just share that — no need to collect
   emails one-by-one).
3. External testing needs a quick one-time **Beta App Review** per build (usually < a day).
4. Testers install the free **TestFlight** app, tap your invite, and get the build.

(Internal testing is instant but limited to people you add as App Store Connect *users* — not ideal for
friends. Public Link is the least-friction option.)
