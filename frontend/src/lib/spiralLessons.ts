const lessonFiles = import.meta.glob('../../lessons_formatted/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const tierFileMap: Record<number, string> = {
  1: '../../lessons_formatted/module1_initiate.md',
  2: '../../lessons_formatted/module2_apprentice.md',
  3: '../../lessons_formatted/module3_adept.md',
};

const moduleNumberMap: Record<string, number> = {
  mentalism: 1,
  correspondence: 2,
  vibration: 3,
  polarity: 4,
  rhythm: 5,
  'cause-effect': 6,
  gender: 7,
};

function getBaseModuleId(moduleId: string) {
  return moduleId.replace(/-(2|3)$/, '');
}

function normalizeLessonMarkdown(content: string) {
  let out = content
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')  // Collapse excessive inline whitespace
    .trim();

  // Split lines that have multiple breath instructions (e.g. "Hold... **→ Exhale...")
  out = out.replace(
    /(\*\*→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\):[^*]+?)\s*\*\*→/g,
    '$1\n**→'
  );

  // Strip leading spaces from breath lines (so Inhale doesn't merge with previous line) and add trailing spaces for markdown line breaks
  out = out.replace(
    /^\s*(\*\*→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\):[^\n]*?)(\s*\n)/gm,
    (_, line) => line.replace(/\s+$/, '') + '  \n'
  );

  // Add trailing spaces to any remaining breath lines (in case they weren't at line start)
  out = out.replace(
    /(\*\*→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\):[^\n]*?)(\s*\n)/g,
    (_, line) => line.replace(/\s+$/, '') + '  \n'
  );

  return out;
}

function extractModuleSection(content: string, moduleNumber: number) {
  const startPattern = new RegExp(
    `^#\\s+\\*\\*MODULE\\s+${moduleNumber}(?:\\s+—|:)`,
    'm'
  );
  const startMatch = startPattern.exec(content);
  if (!startMatch || startMatch.index === undefined) {
    return null;
  }

  const startIndex = startMatch.index;
  const remaining = content.slice(startIndex + startMatch[0].length);
  const nextHeaderMatch = /\n#\s+\*\*MODULE\s+\d+(?:\s+—|:)/.exec(remaining);
  const endIndex = nextHeaderMatch
    ? startIndex + startMatch[0].length + nextHeaderMatch.index
    : content.length;

  return content.slice(startIndex, endIndex).trim();
}

export interface SpiralLessonContent {
  markdown: string;
  tier: number;
  moduleNumber: number;
}

export function getSpiralLessonContent(moduleId: string, tier: number): SpiralLessonContent | null {
  const path = tierFileMap[tier];
  let raw = lessonFiles[path];
  if (!raw) {
    const key = Object.keys(lessonFiles).find((k) => k.endsWith(path.split('/').pop() ?? ''));
    raw = key ? lessonFiles[key] : undefined;
  }
  const lessonFile = typeof raw === 'string' ? raw : (raw as { default?: string })?.default ?? null;
  const moduleNumber = moduleNumberMap[getBaseModuleId(moduleId)];

  if (!lessonFile || !moduleNumber) {
    return null;
  }

  const normalized = normalizeLessonMarkdown(lessonFile);
  const section = extractModuleSection(normalized, moduleNumber);

  if (!section) {
    return null;
  }

  return {
    markdown: section,
    tier,
    moduleNumber,
  };
}
