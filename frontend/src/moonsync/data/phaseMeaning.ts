export type PhaseMeaning = {
  meaning_basic: string;
  historical: string[];
  suggestions_basic: string[];
  advanced_optional: string[];
  moonsync_perspective: string;
};

export const phaseMeaning: Record<string, PhaseMeaning> = {
  newMoon: {
    meaning_basic: 'A quiet reset point in the cycle. Visibility is low, so the focus is on reflection and new beginnings.',
    historical: [
      'Babylonian calendars used the new moon to mark the start of each month.',
      'Greek and Roman traditions observed purification rites at the month’s opening.',
      'Rosh Chodesh in Jewish tradition marks monthly renewal.'
    ],
    suggestions_basic: [
      'Set one simple intention for the next cycle.',
      'Declutter or reset a small area.',
      'Short reflection or journaling.'
    ],
    advanced_optional: [
      'The New Moon marks the internal reset point of the lunar cycle — a moment of withdrawal and quiet reorientation. It symbolizes the instinct to pause, clear the mental field, and release the residue of the previous phase. This is the part of the cycle where stillness becomes intention, and clarity begins to form in the dark.',
      'On a deeper level, the New Moon represents pattern awareness. Old assumptions loosen, new strategies emerge, and the inner compass recalibrates. It’s a symbolic threshold where endings dissolve and openings take shape — the conceptual "zero point" before momentum builds again.'
    ],
    moonsync_perspective: 'A moment of stillness and re-orientation before movement begins.'
  },
  waxingCrescent: {
    meaning_basic: 'Light begins to return. Momentum builds as early efforts take shape.',
    historical: [
      'Many agrarian cultures used this phase for early planting.',
      'Ancient record-keepers used the crescent to track the first visible signs of a new month.'
    ],
    suggestions_basic: [
      'Take a small action toward your intention.',
      'Create a simple plan for the week.',
      'Check in on your energy and resources.'
    ],
    advanced_optional: [
      'The Waxing Crescent symbolizes the first emergence of momentum. After the stillness of the New Moon, this phase reflects tentative motion — small steps, early signals, and the gradual return of direction. It represents the willingness to act before conditions feel perfect, testing the edges of intention through small, measurable moves.',
      'At a deeper level, the Waxing Crescent reveals the tension between possibility and doubt. Patterns begin forming here: habits take shape, clarity strengthens, and the internal compass starts pointing toward something more defined. This phase symbolizes early growth through experimentation — the quiet building of confidence before commitment fully settles in.'
    ],
    moonsync_perspective: 'A practical phase for small steps and steady momentum.'
  },
  firstQuarter: {
    meaning_basic: 'Half light, half dark. This phase often brings decisions or adjustments.',
    historical: [
      'Farmers timed soil work and field preparation around mid-month phases.',
      'Ancient navigators noted the quarter moon for night travel.'
    ],
    suggestions_basic: [
      'Choose one priority and commit to it.',
      'Address a friction point directly.',
      'Refine your plan if needed.'
    ],
    advanced_optional: [
      'The First Quarter marks the structural turning point of the cycle. Energy becomes outward, decisive, and problem-solving focused. This is the phase of friction — where obstacles clarify the path rather than block it. It represents the moment when ideas meet reality and require adjustment, discipline, or strategy.',
      'On a deeper level, the First Quarter symbolizes stability through challenge. Pressure reveals what matters, and resistance becomes a tool for alignment. This phase encourages refinement: strengthening what works, discarding what does not, and engaging directly with the process of shaping one’s direction.'
    ],
    moonsync_perspective: 'A check-in point that rewards clarity and follow-through.'
  },
  waxingGibbous: {
    meaning_basic: 'More light than dark. This is a refinement phase before the peak.',
    historical: [
      'Many cultures used this phase for continued field tending and preparation.',
      'Some calendars marked it as a time for gathering resources.'
    ],
    suggestions_basic: [
      'Refine details or improve quality.',
      'Ask for feedback or second eyes.',
      'Practice consistency in routine.'
    ],
    advanced_optional: [
      'The Waxing Gibbous reflects refinement, focus, and the narrowing of attention toward completion. It symbolizes the phase where work becomes more intentional, details sharpen, and the initial spark matures into something structured. Momentum is steady but patient, emphasizing adjustment rather than force.',
      'At a deeper level, this phase represents the final alignment before expression. Doubt may surface here, not as a barrier but as an invitation to refine purpose. The Waxing Gibbous teaches perseverance and thoughtful calibration — the process of bringing intention into its clearest form before the Full Moon.'
    ],
    moonsync_perspective: 'A practical window for tuning and finishing touches.'
  },
  fullMoon: {
    meaning_basic: 'Maximum visibility. A natural moment to notice results and recognize progress.',
    historical: [
      'Full moons aided night travel and gatherings.',
      'Some traditions scheduled festivals or communal events under full light.'
    ],
    suggestions_basic: [
      'Review what has progressed since the new moon.',
      'Celebrate a clear win or milestone.',
      'Share or present something you’ve built.'
    ],
    advanced_optional: [
      'The Full Moon symbolizes culmination — the peak of visibility, clarity, and emotional sharpness within the cycle. It represents a moment of illumination where patterns, relationships, and choices appear in high contrast. This is the phase where insights surface naturally, revealing what is aligned and what is not.',
      'On a deeper level, the Full Moon reflects the release point of the cycle. Tension that has been building becomes conscious, offering opportunities for acknowledgment and recalibration. It is a symbolic mirror: revealing truths, amplifying awareness, and marking the transition between growth and release.'
    ],
    moonsync_perspective: 'A spotlight moment that invites acknowledgment and gratitude.'
  },
  waningGibbous: {
    meaning_basic: 'Light begins to fade. Emphasis shifts toward reflection and integration.',
    historical: [
      'Post-harvest communities used this phase for storage and planning.',
      'Many traditions emphasized gratitude or sharing during the waning period.'
    ],
    suggestions_basic: [
      'Reflect on lessons learned.',
      'Document what worked and what didn’t.',
      'Share insights with someone you trust.'
    ],
    advanced_optional: [
      'The Waning Gibbous represents integration and shared understanding. After the intensity of the Full Moon, this phase emphasizes reflection, teaching, and the consolidation of insight. It symbolizes the natural shift from output to evaluation — understanding what the cycle has revealed so far.',
      'At a deeper level, this phase reflects the instinct to process and articulate experience. Patterns become clearer through reflection, conversation, or expression. The Waning Gibbous symbolizes the movement from clarity toward meaning, refining lessons that will inform the next cycle.'
    ],
    moonsync_perspective: 'A thoughtful phase for insight, not urgency.'
  },
  lastQuarter: {
    meaning_basic: 'Half light again, now on the way down. A time for release and simplification.',
    historical: [
      'Some agrarian calendars reserved this phase for pruning or clearing tasks.',
      'Monastic and reflective traditions used the waning half for introspection.'
    ],
    suggestions_basic: [
      'Let go of one thing that’s no longer useful.',
      'Tidy or simplify a workflow.',
      'Plan what to carry forward next cycle.'
    ],
    advanced_optional: [
      'The Last Quarter marks the cycle’s structural release point — a moment of reorganization, simplification, and course correction. It symbolizes the phase where remaining attachments, obligations, or outdated patterns become easier to identify and let go. This is the clearing stage that prepares the system for renewal.',
      'On a deeper level, the Last Quarter represents clarity through reduction. It teaches the value of limits, boundaries, and intentional endings. This phase encourages honest evaluation: determining what no longer serves growth and making space for what will.'
    ],
    moonsync_perspective: 'A clearing phase that makes room for what’s next.'
  },
  waningCrescent: {
    meaning_basic: 'Minimal light. A quiet wind-down before the reset.',
    historical: [
      'Many traditions used this phase for rest and preparation.',
      'Old calendars marked it as the end of the month’s cycle.'
    ],
    suggestions_basic: [
      'Rest more than usual.',
      'Finish small loose ends.',
      'Keep plans light and flexible.'
    ],
    advanced_optional: [
      'The Waning Crescent symbolizes dissolution — the gradual softening of momentum and return to inward focus. It reflects the end of the cycle’s arc, where energy withdraws and the need for rest, closure, or quiet becomes more apparent. This is the surrender phase, emphasizing restoration over action.',
      'At a deeper level, this phase represents the release of residual tension and the completion of psychological loops. It is a symbolic exhale before the reset of the New Moon. The Waning Crescent invites stillness, reflection, and the gentle unwinding of the cycle’s final threads.'
    ],
    moonsync_perspective: 'A gentle close that prepares the next beginning.'
  }
};
