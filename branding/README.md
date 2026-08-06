# Sofra — Branding & Marketing

All brand assets, video/commercial prompts, and marketing creative live here, separate
from the app code. Palette: terracotta `#C0532E`, sage `#5E8B6A`, warm paper `#FBF7F2`.
Fonts: Fraunces (display) + Inter (body). Tagline: **"Plan meals, remember it all."**
Website: sofra.savvylabs.dev. Generic mockup data = "The Rivera Family".

## Structure
- **`prompts/`** — video & commercial scripts/prompts
  - `video-prompts-studio.md` — app-walkthrough storyboard + 3 localized brand commercials
    (American/English, N-Indian/Hindi, Maharashtrian/Marathi), tool-agnostic (Veo 3, Runway, Sora…).
  - `video-prompts.md` — 10× 20-second brand-commercial briefs (real-people shoots).
  - `launch-teaser.md` — WhatsApp launch teaser kit.
- **`logo/`** — master logo sources (`icon_full.svg`, `icon_round.svg`, `mark_cream.svg`, `mark_terracotta.svg`).
- **`assets/`** — marketing exports (icon, feature graphic, store screenshots, social cards, lockup),
  plus `ios/` + `android/` platform sets, `screens/` HTML mockup sources, and `end-cards/`.
  See `assets/README.md` for the full export list.
- **`assets/end-cards/`** — ready-to-drop video end-cards (`sofra_endcard_9x16.png`, `sofra_endcard_16x9.png`)
  with logo + tagline + "Free on the App Store / Google Play" + website. HTML sources alongside.

## Notes
- Rendered app-screen PNGs used by the website live in `docs/assets/screens/*.png` (shared with the
  live site); their HTML sources are here in `assets/screens/*.html`.
- Store-badge pills in the end-cards are Sofra-styled; for public store listings, swap in the
  official Apple "Download on the App Store" and Google Play badges per their brand guidelines.
