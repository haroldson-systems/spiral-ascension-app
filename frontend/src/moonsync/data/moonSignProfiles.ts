export type MoonSignName =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export type MoonSignProfile = {
  sign: MoonSignName;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  transitTheme: string;
  kundaliniCue: string;
  bodyFocus: string;
  practiceSuggestion: string;
  shadowWorkPrompt: string;
};

export const moonSignOrder: MoonSignName[] = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

export const moonSignProfiles: Record<MoonSignName, MoonSignProfile> = {
  Aries: {
    sign: 'Aries',
    element: 'Fire',
    transitTheme: 'Initiation, heat, courage, and first movement.',
    kundaliniCue: 'Watch for sudden heat, pressure rising through the spine, restless will, or impulse surges.',
    bodyFocus: 'Head, face, upper spine, ignition point.',
    practiceSuggestion: 'Short activation breath, movement, then grounding before acting.',
    shadowWorkPrompt: 'Where is urgency pretending to be clarity?',
  },
  Taurus: {
    sign: 'Taurus',
    element: 'Earth',
    transitTheme: 'Grounding, stability, body trust, and slow integration.',
    kundaliniCue: 'Notice heaviness, appetite shifts, lower-body steadiness, or resistance to change.',
    bodyFocus: 'Throat, neck, jaw, shoulders, feet.',
    practiceSuggestion: 'Slow nasal breathing, walking, hydration, simple food, and body scanning.',
    shadowWorkPrompt: 'What are you gripping because it feels safer than moving?',
  },
  Gemini: {
    sign: 'Gemini',
    element: 'Air',
    transitTheme: 'Breath, signal, language, nervous-system movement.',
    kundaliniCue: 'Track tingling, quick thoughts, hand/arm energy, fluttering breath, or scattered attention.',
    bodyFocus: 'Lungs, arms, hands, throat bridge.',
    practiceSuggestion: 'Coherent breath, journaling, mantra, and reduced stimulation.',
    shadowWorkPrompt: 'What truth keeps changing shape when you try to name it?',
  },
  Cancer: {
    sign: 'Cancer',
    element: 'Water',
    transitTheme: 'Emotional safety, memory, protection, and inner home.',
    kundaliniCue: 'Watch for chest waves, belly emotion, nostalgia, tenderness, or protective contraction.',
    bodyFocus: 'Chest, stomach, diaphragm, heart shell.',
    practiceSuggestion: 'Gentle belly breathing, warm fluids, soft music, and rest after practice.',
    shadowWorkPrompt: 'What part of you wants care before it wants transformation?',
  },
  Leo: {
    sign: 'Leo',
    element: 'Fire',
    transitTheme: 'Radiance, heart fire, expression, and creative charge.',
    kundaliniCue: 'Notice heart heat, confidence spikes, performance energy, or the urge to be seen.',
    bodyFocus: 'Heart, solar plexus, upper back.',
    practiceSuggestion: 'Heart-centered breath, creative expression, sunlight, then humility practice.',
    shadowWorkPrompt: 'Where does expression become a demand to be validated?',
  },
  Virgo: {
    sign: 'Virgo',
    element: 'Earth',
    transitTheme: 'Refinement, digestion, nervous-system hygiene, and service.',
    kundaliniCue: 'Track gut sensitivity, detail fixation, cleansing urges, or the need to organize energy.',
    bodyFocus: 'Belly, intestines, hands, daily rhythm.',
    practiceSuggestion: 'Simple routine, light stretching, clean food, and practical integration notes.',
    shadowWorkPrompt: 'What are you trying to perfect instead of listen to?',
  },
  Libra: {
    sign: 'Libra',
    element: 'Air',
    transitTheme: 'Balance, relationship field, harmony, and adjustment.',
    kundaliniCue: 'Notice breath changes around people, symmetry seeking, heart/throat negotiation, or social charge.',
    bodyFocus: 'Kidneys, hips, lower back, relational field.',
    practiceSuggestion: 'Balanced breathing, gentle movement, beauty, and boundary check-ins.',
    shadowWorkPrompt: 'Where are you calling imbalance peace?',
  },
  Scorpio: {
    sign: 'Scorpio',
    element: 'Water',
    transitTheme: 'Depth, hidden material, emotional truth, and release.',
    kundaliniCue: 'Watch for pelvic charge, spine heat, emotional waves, dream intensity, or shadow surfacing.',
    bodyFocus: 'Pelvis, sacral bowl, lower spine, reproductive field.',
    practiceSuggestion: 'Slow release breath, journaling, hydration, privacy, and grounding after practice.',
    shadowWorkPrompt: 'What feeling keeps asking to be witnessed instead of controlled?',
  },
  Sagittarius: {
    sign: 'Sagittarius',
    element: 'Fire',
    transitTheme: 'Expansion, meaning, faith, and upward direction.',
    kundaliniCue: 'Notice rising optimism, restless legs, visionary bursts, or heat moving upward fast.',
    bodyFocus: 'Hips, thighs, liver, upward current.',
    practiceSuggestion: 'Walking meditation, long exhales, study, prayer, and moderation.',
    shadowWorkPrompt: 'Where is expansion becoming escape?',
  },
  Capricorn: {
    sign: 'Capricorn',
    element: 'Earth',
    transitTheme: 'Structure, discipline, bones, time, and containment.',
    kundaliniCue: 'Track pressure in joints, spine structure, seriousness, or the need to contain energy.',
    bodyFocus: 'Bones, knees, spine, root support.',
    practiceSuggestion: 'Grounding breath, posture work, boundaries, and a smaller practice done well.',
    shadowWorkPrompt: 'What burden are you calling responsibility?',
  },
  Aquarius: {
    sign: 'Aquarius',
    element: 'Air',
    transitTheme: 'Frequency, insight, nervous-system electricity, and pattern change.',
    kundaliniCue: 'Notice electric sensations, sudden insight, ankle/calf buzzing, or detachment.',
    bodyFocus: 'Ankles, calves, nervous system, subtle field.',
    practiceSuggestion: 'Breath pacing, screen reduction, sound work, and grounding through the feet.',
    shadowWorkPrompt: 'Where are you observing life instead of inhabiting it?',
  },
  Pisces: {
    sign: 'Pisces',
    element: 'Water',
    transitTheme: 'Surrender, dreams, compassion, dissolution, and spiritual sensitivity.',
    kundaliniCue: 'Watch for dream activity, crown softness, emotional merging, fatigue, or mystical openness.',
    bodyFocus: 'Feet, lymph, crown, subtle body.',
    practiceSuggestion: 'Restorative breath, water, prayer, dream notes, and firm energetic boundaries.',
    shadowWorkPrompt: 'What are you absorbing that was never yours to carry?',
  },
};
