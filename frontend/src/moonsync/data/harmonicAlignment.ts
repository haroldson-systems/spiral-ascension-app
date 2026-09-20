/**
 * 13-month (harmonic) mode: "Choose Your Action" + "Harmonic Alignment" copy per harmonic month.
 *
 * ── DRAFT COPY — REVIEW BEFORE MERGE (Jeff + Ghost) ──────────────────────────────
 * Every line below was drafted from the month's existing `meaning_basic` and
 * `suggestions_basic` in harmonicMonths.ts. Edit freely; only the shape matters:
 *   best_for / not_ideal_for  → shown under "Harmonic Alignment"
 *   action                    → the month-specific "Commit to…" button
 *   energetic_mode            → 'amplify' shows "Amplify momentum", 'dissolve' shows "Dissolve resistance"
 * Keyed by harmonicMonths[].month_number.
 * ────────────────────────────────────────────────────────────────────────────────
 */
export type EnergeticMode = 'amplify' | 'dissolve';

export type HarmonicAlignment = {
  best_for: string;
  not_ideal_for: string;
  action: string;
  energetic_mode: EnergeticMode;
};

export const harmonicAlignment: Record<number, HarmonicAlignment> = {
  1: {
    // April · Aries — fresh starts, choosing direction
    best_for: 'choosing a direction, fresh starts, light resets',
    not_ideal_for: 'closing chapters, heavy release work',
    action: 'Name one direction for the year and take a first small step',
    energetic_mode: 'amplify',
  },
  2: {
    // May · Taurus — stability, rhythm, structure
    best_for: 'strengthening routines, practical improvements, steady consistency',
    not_ideal_for: 'abrupt changes, scattering your energy',
    action: 'Anchor one routine that supports you',
    energetic_mode: 'amplify',
  },
  3: {
    // June · Gemini — curiosity, learning, patterns
    best_for: 'learning, experimenting, noticing patterns',
    not_ideal_for: 'locking in final decisions, isolating yourself',
    action: 'Try one new thing and track what repeats',
    energetic_mode: 'amplify',
  },
  4: {
    // Sol · Solar Threshold — clarity, illumination
    best_for: 'clarifying priorities, simplifying, bringing things into the light',
    not_ideal_for: 'starting new projects, avoiding what has become visible',
    action: 'Bring one hidden task or feeling into the light',
    energetic_mode: 'amplify',
  },
  5: {
    // July · Cancer — emotional grounding, inner world
    best_for: 'emotional check-ins, tending relationships, creating comfort',
    not_ideal_for: 'pushing hard, performing for others',
    action: 'Check in with one emotional need and meet it',
    energetic_mode: 'dissolve',
  },
  6: {
    // August · Leo — creativity, confidence, expression
    best_for: 'creative expression, small acts of confidence, celebrating progress',
    not_ideal_for: 'hiding, self-criticism, over-analysis',
    action: 'Express one thing creatively and let it be seen',
    energetic_mode: 'amplify',
  },
  7: {
    // September · Virgo — organizing, refining
    best_for: 'organizing, refining, tending to meaningful details',
    not_ideal_for: 'big launches, sweeping changes',
    action: 'Organize one space or plan so life runs smoother',
    energetic_mode: 'amplify',
  },
  8: {
    // October · Libra — balance, relationships, personal truth
    best_for: 're-evaluating commitments, restoring balance, clarifying boundaries',
    not_ideal_for: 'rushed decisions, people-pleasing',
    action: 'Clarify one boundary and hold it kindly',
    energetic_mode: 'dissolve',
  },
  9: {
    // November · Scorpio — honesty, introspection, deeper truths
    best_for: 'honest introspection, letting go of outdated habits',
    not_ideal_for: 'surface-level fixes, taking on new commitments',
    action: "Name one thing that isn't working and let it go",
    energetic_mode: 'dissolve',
  },
  10: {
    // December · Ophiuchus — healing, integration
    best_for: 'recovery, integration, internal healing',
    not_ideal_for: 'pushing for output, adding more to your plate',
    action: 'Make space for one act of healing',
    energetic_mode: 'dissolve',
  },
  11: {
    // January · Sagittarius — perspective, purpose
    best_for: 'expanding perspective, reconnecting with purpose',
    not_ideal_for: 'narrow focus, fine-detail grind',
    action: 'Explore one idea outside your usual view',
    energetic_mode: 'amplify',
  },
  12: {
    // February · Capricorn — structure, discipline, planning
    best_for: 'long-term goals, building supportive systems, gentle discipline',
    not_ideal_for: 'impulsive changes, scattered starts',
    action: 'Set one long-term goal and build its first structure',
    energetic_mode: 'amplify',
  },
  13: {
    // March · Aquarius → Pisces Threshold — release, renewal
    best_for: "release, reflecting on the year's journey, welcoming what's next",
    not_ideal_for: 'forcing outcomes, new commitments',
    action: "Release one thing you won't carry forward",
    energetic_mode: 'dissolve',
  },
};

export const fallbackHarmonicAlignment: HarmonicAlignment = {
  best_for: 'reflection and cycle-aware planning',
  not_ideal_for: 'forcing action without clarity',
  action: 'Commit to a shift matching this harmonic month',
  energetic_mode: 'amplify',
};
