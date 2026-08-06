#!/usr/bin/env python3
"""
Batch-generate Sofra commercial shots with Google Veo via the google-genai SDK.

Reads a manifest (shots.json), and for every non-static shot in every commercial,
generates a video clip and saves it to <output_dir>/<commercial_id>/<shot_id>.mp4.
Static shots (the end-cards) are existing assets and are skipped (just reported).

Idempotent: a shot whose .mp4 already exists is skipped, so you can re-run safely
after a failure or to fill in only the missing shots.

--------------------------------------------------------------------------------
SETUP
    pip install google-genai

  Auth — pick ONE backend:
    A) Gemini API (simplest):
         export GOOGLE_API_KEY=...            # from https://aistudio.google.com/apikey
    B) Vertex AI (enterprise/GCP billing):
         export GOOGLE_GENAI_USE_VERTEXAI=true
         export GOOGLE_CLOUD_PROJECT=your-gcp-project
         export GOOGLE_CLOUD_LOCATION=us-central1
         gcloud auth application-default login

  Model id (Veo evolves — check current names in the docs and override if needed):
         export VEO_MODEL=veo-3.1-generate-preview

RUN
    python generate_commercials.py --dry-run                 # print prompts, no API calls
    python generate_commercials.py                           # generate everything
    python generate_commercials.py --only b3_marathi         # just one commercial
    python generate_commercials.py --include-vo              # embed the VO line (native audio)

NOTES
  * Visuals are generated language-agnostic by default. Produce clean Hindi/Marathi VO
    with ElevenLabs or a native artist and lay it in post (recommended). Use --include-vo
    only if you want Veo to attempt in-scene narration.
  * Veo's exact config fields (duration_seconds, resolution, person/audio flags) shift
    between model versions. If a field errors, comment it out or check the current docs.
  * After rendering: assemble the 3 shots per commercial, add VO + on-screen supers,
    composite a real app screen into Shot 1's phone, and append the end-card PNG.
--------------------------------------------------------------------------------
"""
import argparse
import json
import os
import sys
import time
from pathlib import Path


def build_prompt(commercial, shot, shared_negative, include_vo):
    """Assemble the final text prompt for one shot."""
    parts = [shot["prompt"]]
    parts.append(
        "Cinematic, photorealistic, natural human faces and hands, "
        "warm acoustic background music, no on-screen text and no visible app UI."
    )
    if include_vo and commercial.get("vo_line"):
        parts.append(
            f'Warm female voiceover in {commercial["language_name"]}: '
            f'"{commercial["vo_line"]}"'
        )
    return " ".join(parts)


def load_image(types, path):
    p = Path(path)
    if not p.exists():
        print(f"        ! reference image not found: {p}")
        return None
    return types.Image(image_bytes=p.read_bytes(), mime_type="image/png")


def generate_shot(client, types, model, prompt, aspect, negative, image, out_path):
    """Submit one generation job, poll to completion, save the mp4."""
    cfg = types.GenerateVideosConfig(
        aspect_ratio=aspect,
        number_of_videos=1,
        negative_prompt=negative or None,
        # duration_seconds=8,          # uncomment if your model version accepts it
        # resolution="1080p",          # uncomment if supported
    )
    kwargs = {"model": model, "prompt": prompt, "config": cfg}
    if image is not None:
        kwargs["image"] = image

    operation = client.models.generate_videos(**kwargs)
    # Poll the long-running operation.
    waited = 0
    while not operation.done:
        time.sleep(10)
        waited += 10
        operation = client.operations.get(operation)
        if waited % 60 == 0:
            print(f"        ...still rendering ({waited}s)")

    resp = getattr(operation, "response", None)
    if not resp or not getattr(resp, "generated_videos", None):
        raise RuntimeError(f"no video returned (error={getattr(operation, 'error', None)})")

    video = resp.generated_videos[0].video
    # Gemini API path: download() populates video_bytes. Vertex path: video.save() works.
    try:
        client.files.download(file=video)
    except Exception:
        pass
    data = getattr(video, "video_bytes", None)
    if data:
        out_path.write_bytes(data)
    else:
        video.save(str(out_path))
    return out_path


def main():
    ap = argparse.ArgumentParser(description="Batch-generate Sofra commercial shots with Veo.")
    ap.add_argument("--manifest", default=str(Path(__file__).with_name("shots.json")))
    ap.add_argument("--only", help="generate only this commercial id (e.g. b3_marathi)")
    ap.add_argument("--model", default=os.environ.get("VEO_MODEL", "veo-3.1-generate-preview"))
    ap.add_argument("--include-vo", action="store_true",
                    help="embed the VO line in the prompt for native audio (default: off, dub in post)")
    ap.add_argument("--dry-run", action="store_true", help="print prompts without calling the API")
    args = ap.parse_args()

    manifest_path = Path(args.manifest).resolve()
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    base = manifest_path.parent
    out_root = (base / manifest.get("output_dir", "renders")).resolve()
    ref_dir = (base / manifest.get("reference_images_dir", ".")).resolve()
    shared_negative = manifest.get("shared_negative", "")

    client = types = None
    if not args.dry_run:
        try:
            from google import genai
            from google.genai import types as _types
            types = _types
        except ImportError:
            sys.exit("Missing dependency. Run:  pip install google-genai")
        client = genai.Client()  # reads GOOGLE_API_KEY or the Vertex env vars

    total = made = 0
    for com in manifest["commercials"]:
        if args.only and com["id"] != args.only:
            continue
        cdir = out_root / com["id"]
        cdir.mkdir(parents=True, exist_ok=True)
        print(f"\n=== {com['id']}  ({com['language_name']}, {com.get('aspect_ratio', '9:16')}) ===")
        for shot in com["shots"]:
            if shot.get("type") == "static":
                print(f"  [static] {shot['id']}: use existing asset {shot['asset']} (append in editor)")
                continue
            total += 1
            out_path = cdir / f"{shot['id']}.mp4"
            if out_path.exists():
                print(f"  [skip ] {shot['id']}: already rendered -> {out_path.name}")
                continue
            prompt = build_prompt(com, shot, shared_negative, args.include_vo)
            print(f"  [gen  ] {shot['id']} (~{shot.get('duration_seconds', 8)}s)")
            if args.dry_run:
                print(f"          {prompt}")
                continue
            image = None
            if shot.get("reference_image"):
                image = load_image(types, ref_dir / shot["reference_image"])
            try:
                generate_shot(client, types, args.model, prompt,
                              com.get("aspect_ratio", "9:16"), shared_negative, image, out_path)
                made += 1
                print(f"          saved -> {out_path}")
            except Exception as e:  # keep going on failures; re-run fills gaps
                print(f"          ERROR: {e}")

    print(f"\nDone. Generated {made}/{total} shots"
          f"{' (dry run)' if args.dry_run else ''}.")
    print("Next: assemble shots per commercial, add VO + supers, composite the app screen "
          "into Shot 1, and append the end-card PNG.")


if __name__ == "__main__":
    main()
