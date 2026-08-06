# Sofra — Commercials: Scene-by-Scene Script (LTX Studio / Google Flow ready)

Three commercials, same emotional arc, localized cast + food + wardrobe + **spoken language**:
**B1 American / English · B2 North-Indian desi / Hindi · B3 Maharashtrian / Marathi.**
Each = **3 generated shots (~8s) + a static end-card** (the end-card is an existing PNG, *not*
generated). Machine-readable version for the batch API: `../production/shots.json`.

**How to use in LTX Studio / Flow**
1. New project per commercial (keeps one family/set consistent across shots).
2. Paste each **Shot prompt** as one scene/shot; set aspect **9:16**, duration **~8s**.
3. Attach the listed **reference image** (only the end-card here; add a cast reference photo to lock
   the family's look across shots if you have one).
4. Generate the 3 shots, then drop the **end-card PNG** as the final 2–3s.
5. Add the **VO** (re-recorded/dubbed — see language note) and **on-screen super** in the editor,
   then composite a **real app screen** (`docs/assets/screens/*.png`) into the phone in Shot 1.

**Shared negative prompt (paste into every shot):**
> fake app UI, readable phone screen, distorted hands or faces, extra fingers, warped text, glossy
> studio food, stock-ad look, watermark, logo artifacts, subtitles

**Language note:** generate visuals language-agnostic; produce clean **Hindi/Marathi VO** with
ElevenLabs or a native artist and lay it in post (AI in-scene speech is unreliable for Marathi).

---

## B1 — American family · English  (`id: b1_american`, 9:16)
**VO (full, warm female, American English):** "Every family has a hundred little meals they love —
and slowly forget. Sofra remembers them all, so the ones that matter never get lost."
**On-screen supers:** Shot 1 → *"Rate it once. Remember it forever."* · End-card → *"Plan meals, remember it all."*

- **Shot 1 (0–8s) — the pause.** Bright open-plan suburban kitchen, golden-hour light through big
  windows, wood island, subway tile, herbs on the sill. A relaxed mid-30s parent opens the fridge,
  pauses ("what do we make tonight?"), then glances at a phone held low and angled away from camera
  (screen NOT visible), a small knowing smile. Gentle handheld, shallow depth of field, warm grade,
  slow push-in. *Post: composite a real app screen into the phone; add the super.*
- **Shot 2 (8–16s) — cooking together.** The family drifts into easy cooking — two kids (~7 and
  ~10) and the other parent; a kid steals a bite; laughter; roast chicken, fresh salad, a pot of
  pasta on the counter. Warm, unhurried, gentle handheld, medium shots.
- **Shot 3 (16–24s) — the table.** The family sits and eats together, content, soft golden light;
  a calm final beat with room to breathe. Slow pull-back.
- **End-card (24–26s) — static.** `branding/assets/end-cards/sofra_endcard_9x16.png`, hold ~2–3s.

---

## B2 — North-Indian desi family · Hindi  (`id: b2_hindi`, 9:16)
**VO (full, warm female, Hindi):** "हर घर में माँ के हाथ का एक ऐसा खाना होता है, जो सबको याद रहता है… और
कुछ ऐसे भी, जो धीरे-धीरे भूल जाते हैं। Sofra हर स्वाद को याद रखता है — ताकि आपका परिवार उसे कभी न भूले।"
*(Har ghar mein maa ke haath ka ek aisa khaana hota hai, jo sabko yaad rehta hai… aur kuch aise bhi,
jo dheere-dheere bhool jaate hain. Sofra har swaad ko yaad rakhta hai — taaki aapka parivaar use
kabhi na bhoole.)*
**Supers:** Shot 1 → *"रेट करो, कभी मत भूलो।"* · End-card → *"खाना प्लान करें, यादें सँभालें।"*

- **Shot 1 (0–8s) — the kitchen.** Cozy North-Indian home kitchen: steel utensils, masala dabba,
  pressure cooker, earthy warm tones, a small diya shelf. A grandmother (dadi, soft saree) and the
  mother (cotton kurti/saree) cook together, gentle steam, easy chatter; the mother glances at a
  phone held low and angled away (screen NOT visible), a warm nod. Handheld, shallow DOF, golden grade.
  *Post: composite real app screen into the phone; add the super.*
- **Shot 2 (8–16s) — the gathering.** The family gathers — young parents, two kids (one with a
  steel tiffin); kids reach for food; dadi serves; roti puffs on the tawa; rajma-chawal, dal, a
  simple sabzi. Laughter, warmth, handheld medium shots.
- **Shot 3 (16–24s) — eating together.** Everyone eats together (floor mat or table), content and
  close; soft warm light; calm final beat. Slow pull-back.
- **End-card (24–26s) — static.** `branding/assets/end-cards/sofra_endcard_9x16.png`, hold ~2–3s.

---

## B3 — Maharashtrian family · Marathi  (`id: b3_marathi`, 9:16)
**VO (full, warm female, Marathi):** "प्रत्येक घरात आईच्या हातचं एक खास जेवण असतं — जे सगळ्यांना आठवतं… आणि
काही असंही, जे हळूहळू विसरलं जातं. Sofra प्रत्येक चव लक्षात ठेवतं — म्हणजे तुमचं कुटुंब ती कधीच विसरणार नाही."
*(Pratyek gharat aai-chya haatcha ek khaas jevan asta — je saglyanna aathavta… aani kaahi asahi, je
haluhalu visarla jata. Sofra pratyek chav lakshat thevta — mhanaje tumcha kutumb ti kadhich visarnaar
naahi.)*
**Supers:** Shot 1 → *"एकदा रेट करा, कधीच विसरू नका."* · End-card → *"जेवण ठरवा, आठवणी जपा."*

- **Shot 1 (0–8s) — the kitchen.** Traditional Maharashtrian home kitchen: brass and steel vessels,
  warm wood, soft daylight. A grandmother (aaji, cotton/nauvari saree) and the mother (simple cotton
  saree/kurta) cook together, gentle steam, quiet warmth; the mother checks a phone held low and
  angled away (screen NOT visible), a soft smile. Handheld, shallow DOF, warm natural grade.
  *Post: composite real app screen into the phone; add the super.*
- **Shot 2 (8–16s) — the gathering.** The family gathers — parents and a school-age child (steel
  dabba); the child is served first; varan-bhaat with a spoon of toop, poli-bhaji, a plate of
  thalipeeth. Easy laughter, handheld medium shots.
- **Shot 3 (16–24s) — eating together.** Everyone eats together, content and rooted; warm light;
  calm final beat. Slow pull-back.
- **End-card (24–26s) — static.** `branding/assets/end-cards/sofra_endcard_9x16.png`, hold ~2–3s.
