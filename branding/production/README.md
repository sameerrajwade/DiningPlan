# Sofra — Commercial production (batch generation)

Batch-generate the three commercials' shots from a single manifest, instead of prompting
one clip at a time.

- **`shots.json`** — the manifest: 3 commercials (English / Hindi / Marathi), each with 3
  generated shots + a static end-card. Edit prompts here.
- **`generate_commercials.py`** — reads the manifest and renders each shot to
  `renders/<commercial_id>/<shot_id>.mp4` using Google **Veo** (via the `google-genai` SDK).
- **`renders/`** — output clips (git-ignored; created on first run).

The human-readable, LTX-Studio/Flow-ready version of the same content is
`../prompts/commercials-scene-script.md`.

## Quick start (Veo)
```bash
pip install google-genai

# Auth — pick one:
export GOOGLE_API_KEY=...                 # Gemini API (https://aistudio.google.com/apikey)
# — or Vertex AI —
export GOOGLE_GENAI_USE_VERTEXAI=true
export GOOGLE_CLOUD_PROJECT=your-project
export GOOGLE_CLOUD_LOCATION=us-central1
gcloud auth application-default login

export VEO_MODEL=veo-3.1-generate-preview  # override if the current model id differs

python generate_commercials.py --dry-run   # sanity-check prompts, no API calls / no cost
python generate_commercials.py             # generate all shots (skips ones already rendered)
python generate_commercials.py --only b3_marathi
python generate_commercials.py --include-vo  # let Veo attempt native VO (else dub in post)
```

## Recommended pipeline
1. `--dry-run` first to review every prompt.
2. Generate visuals (VO off) → 9 clips (3 commercials × 3 shots).
3. Produce clean **Hindi + Marathi VO** with ElevenLabs or a native artist (AI in-scene
   Marathi is unreliable); English VO from the script.
4. In your editor: per commercial, lay the 3 shots + VO + on-screen super, **composite a real
   app screen** (`docs/assets/screens/*.png`) into Shot 1's phone, then append the end-card
   (`branding/assets/end-cards/sofra_endcard_9x16.png`).
5. Export 9:16 (Reels/Shorts) and a 16:9 cutdown (use `sofra_endcard_16x9.png`).

## Using a different engine
The manifest is engine-agnostic. To target **OpenAI Sora** instead of Veo, keep `shots.json`
as the source of truth and swap the generation call in `generate_shot()` for the Sora video
API (submit prompt + aspect ratio, poll the job, download the mp4). Everything else — batching,
skip-if-exists, output layout — stays the same. **LTX Studio / Google Flow** users don't need
this script at all; use `../prompts/commercials-scene-script.md` and paste scene by scene.

> Model ids and config fields (duration, resolution, audio flags) change between Veo versions.
> If a config field errors, comment it out in `generate_commercials.py` or check current docs.
