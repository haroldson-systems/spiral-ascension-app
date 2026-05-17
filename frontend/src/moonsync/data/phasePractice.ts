export type PhasePractice = {
  energy: string;
  sessionName: string;
  sessionEntryId: string;
  breathworkFocus: {
    objective: string;
    pattern: string;
    visualization: string;
    somaticCue: string;
  };
  reflectivePrompt: string;
  learnMore: {
    label: string;
    href: string;
  }[];
};

export const phasePractice: Record<string, PhasePractice> = {
  newMoon: {
    energy: 'Stillness, reset, and clean intention.',
    sessionName: 'Axis - 5-Min Ignition',
    sessionEntryId: 'axis-ignition-5',
    breathworkFocus: {
      objective: 'Clear residue from the last cycle and return to the center point.',
      pattern: '4-4-4-4 box breath for five minutes.',
      visualization: 'An open silver circle forms in the dark, empty but awake.',
      somaticCue: 'Let the jaw soften and feel the spine stack one breath at a time.',
    },
    reflectivePrompt: 'What wants to begin only after you stop forcing it?',
    learnMore: [{ label: 'New Moon Lore', href: '/practice-entry/lore-new-moon' }],
  },
  waxingCrescent: {
    energy: 'First movement, small action, and early trust.',
    sessionName: 'Navigator - 5-Min Drill',
    sessionEntryId: 'helix-timeline-nav-5',
    breathworkFocus: {
      objective: 'Turn intention into one grounded next step.',
      pattern: '4-4-4-4 into 6-2-6-2, then easy wave breathing.',
      visualization: 'A thin crescent of light points toward the next reachable action.',
      somaticCue: 'Lean forward slightly on the inhale, then settle your feet on the exhale.',
    },
    reflectivePrompt: 'What small action would prove the path is already opening?',
    learnMore: [{ label: 'Waxing Crescent Lore', href: '/practice-entry/lore-waxing-crescent' }],
  },
  firstQuarter: {
    energy: 'Choice, friction, structure, and commitment.',
    sessionName: 'Clarity Practice I - Physio-Sync',
    sessionEntryId: 'clarity-physio-sync',
    breathworkFocus: {
      objective: 'Meet resistance without collapsing or rushing.',
      pattern: 'Steady inhale and longer exhale until the body finds coherence.',
      visualization: 'Half light, half dark: both sides hold the same center line.',
      somaticCue: 'Press the feet down and let the belly expand before each decision.',
    },
    reflectivePrompt: 'What decision is asking for a cleaner yes or no?',
    learnMore: [{ label: 'First Quarter Lore', href: '/practice-entry/lore-first-quarter' }],
  },
  waxingGibbous: {
    energy: 'Refinement, preparation, and patient improvement.',
    sessionName: 'Expander - 5-Min Micro-Drill',
    sessionEntryId: 'fractal-expander-5',
    breathworkFocus: {
      objective: 'Tune the pattern before it reaches full visibility.',
      pattern: '4-8-4-0 followed by smooth equal breathing.',
      visualization: 'The almost-full moon polishes rough edges into a cleaner signal.',
      somaticCue: 'Relax the shoulders and notice where the body keeps overworking.',
    },
    reflectivePrompt: 'What detail would make the whole pattern feel more honest?',
    learnMore: [{ label: 'Waxing Gibbous Lore', href: '/practice-entry/lore-waxing-gibbous' }],
  },
  fullMoon: {
    energy: 'Illumination, culmination, and honest reflection.',
    sessionName: 'Cycler - 5-Min Breath',
    sessionEntryId: 'vortex-shadow-cycler-5',
    breathworkFocus: {
      objective: 'Let what is visible become useful instead of overwhelming.',
      pattern: '4-4-8-4 for charge, then free wave breathing for release.',
      visualization: 'Bright lunar light reveals the pattern without judgment.',
      somaticCue: 'Keep the chest open and let each exhale discharge extra intensity.',
    },
    reflectivePrompt: 'What has become too clear to ignore?',
    learnMore: [{ label: 'Full Moon Lore', href: '/practice-entry/lore-full-moon' }],
  },
  waningGibbous: {
    energy: 'Integration, gratitude, and shared wisdom.',
    sessionName: 'Integration Practice I - Return to Center',
    sessionEntryId: 'integration-return-center',
    breathworkFocus: {
      objective: 'Turn insight into something the nervous system can keep.',
      pattern: 'Natural inhale, slow exhale, brief pause after empty.',
      visualization: 'Moonlight becomes memory, settling from crown to heart.',
      somaticCue: 'Place one hand on the sternum and one on the belly while you breathe.',
    },
    reflectivePrompt: 'What lesson is ready to be carried forward gently?',
    learnMore: [{ label: 'Waning Gibbous Lore', href: '/practice-entry/lore-waning-gibbous' }],
  },
  lastQuarter: {
    energy: 'Release, simplification, and clean boundaries.',
    sessionName: 'Release Practice II - Soft Unwinding',
    sessionEntryId: 'release-soft-unwinding',
    breathworkFocus: {
      objective: 'Let go of one burden without turning release into force.',
      pattern: 'Easy inhale, extended sighing exhale, no hold.',
      visualization: 'The moon cuts away what no longer belongs in the next cycle.',
      somaticCue: 'Unclench the hands on each exhale and let the ribs drop.',
    },
    reflectivePrompt: 'What can be released because it has already taught you enough?',
    learnMore: [{ label: 'Last Quarter Lore', href: '/practice-entry/lore-last-quarter' }],
  },
  waningCrescent: {
    energy: 'Rest, surrender, and quiet completion.',
    sessionName: 'Grounding Practice II - 4-7-8 Descent',
    sessionEntryId: 'grounding-478-lull',
    breathworkFocus: {
      objective: 'Downshift the system and prepare for renewal.',
      pattern: '4-7-8 breathing, kept gentle and unforced.',
      visualization: 'A fading crescent lowers the lights inside the body.',
      somaticCue: 'Let the eyelids grow heavy and feel the back body supported.',
    },
    reflectivePrompt: 'What would rest look like if it did not need to be earned?',
    learnMore: [{ label: 'Waning Crescent Lore', href: '/practice-entry/lore-balsamic' }],
  },
};
