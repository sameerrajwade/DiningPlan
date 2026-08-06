# Sofra — Brand & Marketing Assets

All generated from the master steam-bowl mark (`../icon_full.svg`) in the Terracotta & Sage
palette (terracotta `#C0532E`, sage `#5E8B6A`, warm paper `#FBF7F2`) with Fraunces (display) +
Inter (body). Every `.png` has an editable `.html` source next to it.

## Regenerate
Assets render via headless Chrome @2× → downscale with sharp. Edit the `.html`, then re-run the
render command from the session notes (Chrome `--headless --screenshot` at the target size, then
`sharp().resize(w,h)`). Icon renders from SVG via sharp directly (no fonts needed).

## Folder layout
Platform store assets are split into per-platform folders; cross-platform brand/social assets stay
at the root. The generic app-screen mockups in `screens/` are shared by both platforms.

- **`android/`** — Google Play store assets (+ their `.html` sources and `icon_play.svg`).
- **`ios/`** — Apple App Store assets (app icon 1024, branded 6.7"/6.5" screenshots, device frames, iPad).
- **root** — shared brand/social assets used everywhere.
- **`screens/`** — shared generic app-screen mockups embedded by both platforms' shots.

### `android/` — Google Play
| File | Size | Use |
|------|------|-----|
| `sofra_icon_512.png` | 512×512 | **Play Store app icon** (full-bleed; Play masks corners). |
| `sofra_feature.png` | 1024×500 | **Play Store feature graphic.** |
| `sofra_shot_home.png` | 1080×1920 | Play phone screenshot 1 — "meal memory". |
| `sofra_shot_plan.png` | 1080×1920 | Play phone screenshot 2 — "planned week". |
| `sofra_shot_insights.png` | 1080×1920 | Play phone screenshot 3 — "insights". |

### `ios/` — Apple App Store
| File | Size | Use |
|------|------|-----|
| `sofra_icon_1024.png` | 1024×1024 | **App Store app icon** (no alpha). |
| `sofra_ios67_brand_{home,plan,insights}.png` | 1290×2796 | **Branded** 6.7" App Store screenshots (Sofra lockup + headline + generic-data phone). |
| `sofra_ios65_brand_{home,plan,insights}.png` | 1242×2688 | Same, 6.5" slot. |
| `sofra_ios_{67,65,ipad}_*.png` | various | Earlier plain device-frame shots (kept as fallback). |

### root — shared brand / social
| File | Size | Use |
|------|------|-----|
| `sofra_reel.png` | 1080×1920 | YouTube Shorts / Instagram Reels cover or end-card. |
| `sofra_square.png` | 1080×1080 | Instagram feed post. |
| `sofra_og.png` | 1200×630 | Website Open Graph / social link-preview image. |
| `sofra_lockup.png` | 900×280 | Horizontal logo lockup, **transparent** — site header, press, email. |

## Generic app-screen mockups (`screens/`)
Faithful HTML rebuilds of the app UI with generic global data (The Rivera Family; dishes like
Veggie Stir-Fry, Grilled Salmon, Spaghetti Bolognese, Beef Tacos; restaurants Nonna's Kitchen /
Green Bowl; cuisines Italian/American/Mexican/Asian; USD). All 9 rendered at 1280×2706:
`login, household, home, addmeal, plan, celebration, insights, share, calendar`. These are the
canonical source and have been copied into `docs/assets/screens/` — the whole index.html gallery
is now generic (no personal/Indian data). Login/signup use the current steam-bowl mark (were on the
old fork-and-knife icon); signup copy de-AI'd. The 3 `sofra_shot_*` store frames embed the generic
home/plan/insights, so they're store-ready.

To tweak: edit `screens/<name>.html`, re-render (Chrome headless 1280×2706 @1.5× → sharp resize),
copy to `docs/assets/screens/`, and (for home/plan/insights) re-render the matching `sofra_shot_*`.

### Still on personal data
`docs/screens/*.png` (the 21 numbered walkthrough shots used by `guide.html`) still show the old
personal/Indian data — regenerate those too if the guide page matters for launch.
