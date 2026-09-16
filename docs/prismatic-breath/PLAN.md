# Prismatic Breath (Tile 5) — redesign plan & content intake

**Status: BRANCH PREP ONLY.** No practice copy, scripts or videos are invented here. Implementation waits for
Jeff + Ghost to approve the content below. Everything marked `TODO` is a decision or asset owed by the content owners.

## Target structure (from Jeff, 2026-09-15)
Choose-your-state flow with five states: **Ground · Balance · Release · Restore · Awaken**
(a sixth "Threshold" state was floated as *coming later* — TODO confirm in/out).

## How Tile 5 is sourced today (verified 2026-09-15 against live API + repo main)
| Layer | Source of truth | Effect of a code edit |
|---|---|---|
| Tile card (title / subtitle / description) | Supabase `practices` row `breathwork-compendium` (DB wins on merge) | none — must be edited via `/admin` |
| 5 lanes + 10 slots (`grounding-*`, `activation-*`, `release-*`, `clarity-*`, `integration-*`) | `frontend/src/data/practices.ts` only (no DB rows in `practice_variants`) | changes live copy |
| Lane chooser heading "Choose your lane" | `pages/PracticeDetail.tsx` | changes live copy |
| Marketing copy "10 breathwork practices across 5 categories", "beginner to advanced" | `pages/EntryPage.tsx` | changes live copy |
| Level-chip colours | `components/PracticeCard.tsx` | — |
| YouTube embeds | `lib/videoEmbeds.ts` | — |

## Implementation shape (no schema change)
- Keep `practice_variants` shape; model 5 state variants (`kind: 'state'`) each with 2 mode variants
  (`kind: 'mode'`, e.g. **Quick Shift 3–5 min** / **Deep Practice 10–20 min**) → 15 code-only entries replacing today's 5 lanes + 10 slots.
- Rename lane chooser to the approved wording (TODO: "Choose your state"?).
- Update EntryPage copy to match the final count/wording.
- Wire videos through `lib/videoEmbeds.ts` only after URLs are approved (candidate shortlist lives in the DM thread of 2026-09-15; not embedded).
- Tile card row in Supabase updated via `/admin` by Jeff after merge (DB change — owner action).

## Content intake — one block per state (fill before implementation)
For each of Ground · Balance · Release · Restore · Awaken:
```
State name / one-line promise:            TODO
Feeling state it serves (2–3 words):      TODO
Quick Shift (3–5 min) — breath pattern:   TODO   script: TODO   media URL: TODO   Hz (if any): TODO
Deep Practice (10–20 min) — breath pattern: TODO script: TODO   media URL: TODO   Hz (if any): TODO
Cautions / contraindications:             TODO
Level chip (Beginner / Intermediate / Advanced): TODO
```
The existing `media-intake-template.md` in the repo root can be used per media asset.

## Open decisions (Jeff + Ghost)
1. Threshold as 6th state now, "coming later" placeholder, or omitted?
2. Mode names + durations (Quick Shift / Deep Practice proposed).
3. Reuse any of today's 10 slot descriptions or start clean?
4. Final chooser heading and EntryPage marketing line.
