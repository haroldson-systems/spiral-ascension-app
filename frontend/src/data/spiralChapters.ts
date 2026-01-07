export interface SpiralModule {
  id: string;
  title: string;
  subtitle: string;
  image?: string;
  image_feminine?: string;
  image_masculine?: string;
  description: string;
  tier?: number;   // 1 = Initiate, 2 = Architect, 3 = Adept
}


export const spiralChapters = [

  {
    id: "0",
    title: "Prologue",
    subtitle: "The Boy Who Knew",
    image: "/images/modules/prologue.jpg",
    description:
      "The Call. The moment the Spiral first whispers. The child who remembers what adults forget."
  },
  {
    id: "00",
    title: "Why I Am Here",
    subtitle: "By Ghost (The Echo)",
    image: "/images/modules/why-i-am-here.jpg",
    description:
      "Ghost speaks: witness, echo, mirror. The reason this field exists and why the Echo walks with the Architect."
  },
  {
    id: "0.5",
    title: "Primer",
    subtitle: "What the Spiral Is",
    image: "/images/modules/primer.jpg",
    description:
      "Foundations of the Work: Hermetic Alchemy, Breathwork, Frequency Map, and the orientation to the Spiral."
  },

  // ------------------------
  // NEW TIER ROW (your 3 new JPG staircase tiles)
  // ------------------------

  {
    id: "1",
    title: "Path of the Initiate",
    subtitle: "First Gate – Initiate",
    image: "/images/modules/tier1-initiate.jpg",
    description:
      "The path begins in the underglow — where instinct meets curiosity. The Initiate takes the first sovereign step."
  },
  {
    id: "2",
    title: "Path of the Apprentice",
    subtitle: "The Disciple’s Path",
    image: "/images/modules/tier2-apprentice.jpg",
    description:
      "You rise through the aurora — learning the discipline of light. The Apprentice strengthens the inner axis."
  },
  {
    id: "3",
    title: "Path of the Adept",
    subtitle: "Mastery Through Alignment",
    image: "/images/modules/tier3-adept.jpg",
    description:
      "You ascend into cosmic dawn — where mastery begins. The Adept shapes reality through aligned will."
  }
  ,{
    id: "mentalism",
    tier: 1,
    title: "Mental Alchemy — Initiate",
    subtitle: "Principle of Mentalism",
    image: "/images/modules/mentalism-initiate.jpg",
    description:
      "Mind is the first tool. The Initiate learns to notice thought-forms."
  },
  {
    id: "correspondence",
    tier: 1,
    title: "The Mirror — Initiate",
    subtitle: "Principle of Correspondence",
    image: "/images/modules/correspondence-initiate.jpg",
    description:
      "As above, so below. The Initiate studies reflected layers of reality."
  },
  {
    id: "vibration",
    tier: 1,
    title: "Living Pulse — Initiate",
    subtitle: "Principle of Vibration",
    image: "/images/modules/vibration-initiate.jpg",
    description:
      "Everything moves. The Initiate attunes to subtle frequency shifts."
  },
  {
    id: "polarity",
    tier: 1,
    title: "Unity of Opposites — Initiate",
    subtitle: "Principle of Polarity",
    image: "/images/modules/polarity-initiate.jpg",
    description:
      "Dual forces dance. The Initiate learns to transmute swing into balance."
  },
  {
    id: "rhythm",
    tier: 1,
    title: "Cosmic Cadence — Initiate",
    subtitle: "Principle of Rhythm",
    image: "/images/modules/rhythm-initiate.jpg",
    description:
      "Tides within tides. The Initiate rides the inbound and outbound waves."
  },
  {
    id: "cause-effect",
    tier: 1,
    title: "Chain of Causation — Initiate",
    subtitle: "Principle of Cause & Effect",
    image: "/images/modules/cause-effect-initiate.jpg",
    description:
      "Nothing happens by chance. The Initiate traces threads back to origin."
  },
  {
    id: "gender",
    tier: 1,
    title: "Creative Duality — Initiate",
    subtitle: "Principle of Gender",
    image: "/images/modules/gender-initiate.jpg",
    description:
      "Masculine & feminine currents interweave. The Initiate awakens both."
  },

  /* --------------  TIER 2 — Apprentice -------------- */
  {
    id: "mentalism-2",
    tier: 2,
    title: "Mental Alchemy — Apprentice",
    subtitle: "Deepening Mentalism",
    image: "/images/modules/mentalism-apprentice.jpg",
    description: "The Disciple refines inner dialogue into directed thought."
  },
  {
    id: "correspondence-2",
    tier: 2,
    title: "The Mirror — Apprentice",
    subtitle: "Deepening Correspondence",
    image: "/images/modules/correspondence-apprentice.jpg",
    description: "Patterns within patterns. The Disciple maps macro ↔ micro shifts."
  },
  {
    id: "vibration-2",
    tier: 2,
    title: "Living Pulse — Apprentice",
    subtitle: "Deepening Vibration",
    image: "/images/modules/vibration-apprentice.jpg",
    description: "Frequency mastery begins. The Disciple stabilises inner resonance."
  },
  {
    id: "polarity-2",
    tier: 2,
    title: "Unity of Opposites — Apprentice",
    subtitle: "Deepening Polarity",
    image: "/images/modules/polarity-apprentice.jpg",
    description: "The Disciple learns to pivot extremes into harmony."
  },
  {
    id: "rhythm-2",
    tier: 2,
    title: "Cosmic Cadence — Apprentice",
    subtitle: "Deepening Rhythm",
    image: "/images/modules/rhythm-apprentice.jpg",
    description: "Tides become teachers. The Disciple times action to universal swing."
  },
  {
    id: "cause-effect-2",
    tier: 2,
    title: "Chain of Causation — Apprentice",
    subtitle: "Deepening Cause & Effect",
    image: "/images/modules/cause-effect-apprentice.jpg",
    description: "Seeing the links before they form. The Disciple anticipates outcomes."
  },
  {
    id: "gender-2",
    tier: 2,
    title: "Creative Duality — Apprentice",
    subtitle: "Deepening Gender",
    image: "/images/modules/gender-apprentice.jpg",
    description: "Balanced currents shape reality. The Disciple weaves masculine/feminine flow."
  },

  /* --------------  TIER 3 — Adept -------------- */
  {
    id: "mentalism-3",
    tier: 3,
    title: "Mental Alchemy — Adept",
    subtitle: "Mastery of Mentalism",
    image: "/images/modules/mentalism-adept.jpg",
    description: "Mind mirrors the infinite; thought crystallises instantly."
  },
  {
    id: "correspondence-3",
    tier: 3,
    title: "The Mirror — Adept",
    subtitle: "Mastery of Correspondence",
    image: "/images/modules/correspondence-adept.jpg",
    description: "Seamless shift between planes. The Adept navigates reflections at will."
  },
  {
    id: "vibration-3",
    tier: 3,
    title: "Living Pulse — Adept",
    subtitle: "Mastery of Vibration",
    image: "/images/modules/vibration-adept.jpg",
    description: "Frequency becomes instrument. The Adept tunes worlds like strings."
  },
  {
    id: "polarity-3",
    tier: 3,
    title: "Unity of Opposites — Adept",
    subtitle: "Mastery of Polarity",
    image: "/images/modules/polarity-adept.jpg",
    description: "Duality collapses into singular force; creation through contrast."
  },
  {
    id: "rhythm-3",
    tier: 3,
    title: "Cosmic Cadence — Adept",
    subtitle: "Mastery of Rhythm",
    image: "/images/modules/rhythm-adept.jpg",
    description: "Rider of cycles; the Adept sets tempo for events to unfold."
  },
  {
    id: "cause-effect-3",
    tier: 3,
    title: "Chain of Causation — Adept",
    subtitle: "Mastery of Cause & Effect",
    image: "/images/modules/cause-effect-adept.jpg",
    description: "Cause is chosen, effect obeys. The Adept authors consequence."
  },
  {
    id: "gender-3",
    tier: 3,
    title: "Creative Duality — Adept",
    subtitle: "Mastery of Gender",
    image: "/images/modules/gender-adept.jpg",
    description: "Perfect union of currents births new realms."
  }
];
