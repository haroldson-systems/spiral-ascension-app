import type { SpiralModule } from '@/data/spiralChapters';
import { spiralSpecialLessons } from '@/data/spiralSpecialLessons';
import { getSpiralLessonContent } from '@/lib/spiralLessons';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://127.0.0.1:8001/api';

const DEFAULT_FETCH_TIMEOUT_MS = 25_000;

/** Abortable fetch with a wall-clock timeout so hung requests do not block UI forever. */
function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const { signal: userSignal, ...rest } = init;

  if (userSignal) {
    if (userSignal.aborted) {
      clearTimeout(timeoutId);
      controller.abort();
    } else {
      userSignal.addEventListener(
        'abort',
        () => {
          clearTimeout(timeoutId);
          controller.abort();
        },
        { once: true }
      );
    }
  }

  return fetch(input, { ...rest, signal: controller.signal }).finally(() =>
    clearTimeout(timeoutId)
  );
}

function getAdminToken(): string | null {
  try {
    return localStorage.getItem('adminToken');
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getAdminToken();
  if (token) {
    headers.set('x-admin-token', token);
  }

  const response = await fetchWithTimeout(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchSpiralModules(tier?: number): Promise<SpiralModule[]> {
  const query = tier === undefined ? '' : `?tier=${encodeURIComponent(tier)}`;
  return request<SpiralModule[]>(`/spiral-modules${query}`);
}

export async function upsertSpiralModule(module: SpiralModule): Promise<SpiralModule> {
  return request<SpiralModule>('/spiral-modules', {
    method: 'POST',
    body: JSON.stringify(module),
  });
}

export async function deleteSpiralModule(moduleId: string): Promise<void> {
  await request(`/spiral-modules/${encodeURIComponent(moduleId)}`, { method: 'DELETE' });
}

export async function bulkUpsertSpiralModules(modules: SpiralModule[]): Promise<SpiralModule[]> {
  return request<SpiralModule[]>('/spiral-modules/bulk', {
    method: 'POST',
    body: JSON.stringify(modules),
  });
}

export interface LessonContent {
  markdown: string;
  tier: number;
  moduleNumber: number;
}

const TIER_FILES: Record<number, string> = {
  1: 'module1_initiate.md',
  2: 'module2_apprentice.md',
  3: 'module3_adept.md',
};
const MODULE_NUMBERS: Record<string, number> = {
  mentalism: 1,
  correspondence: 2,
  vibration: 3,
  polarity: 4,
  rhythm: 5,
  'cause-effect': 6,
  gender: 7,
};

function normalizeLessonMarkdown(content: string): string {
  let out = content
    .replace(/\u00a0/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')  // Collapse excessive inline whitespace
    .trim();
  out = out.replace(
    /(\*\*→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\):[^*]+?)\s*\*\*→/g,
    '$1\n**→'
  );
  out = out.replace(
    /^\s*(\*\*→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\):[^\n]*?)(\s*\n)/gm,
    (_, line: string) => line.replace(/\s+$/, '') + '  \n'
  );
  out = out.replace(
    /(\*\*→\s*(?:Inhale|Hold|Exhale|Pause)\s*\(\d+\):[^\n]*?)(\s*\n)/g,
    (_, line: string) => line.replace(/\s+$/, '') + '  \n'
  );
  return out;
}

function extractModuleSection(content: string, moduleNumber: number): string | null {
  const startRe = new RegExp(`^#\\s+\\*\\*MODULE\\s+${moduleNumber}(?:\\s+—|:)`, 'm');
  const startMatch = content.match(startRe);
  if (!startMatch || startMatch.index === undefined) return null;

  const sliceStart = startMatch.index;
  const afterStart = sliceStart + startMatch[0].length;
  const nextRe = /\n#\s+\*\*MODULE\s+\d+(?:\s+—|:)/g;
  nextRe.lastIndex = afterStart;
  const nextMatch = nextRe.exec(content);
  const sliceEnd = nextMatch ? nextMatch.index : content.length;
  return content.slice(sliceStart, sliceEnd).trim();
}

export async function fetchLessonContent(
  moduleId: string,
  tier: number
): Promise<LessonContent | null> {
  const specialLesson = spiralSpecialLessons[moduleId];
  if (specialLesson && specialLesson.tier === tier) {
    return specialLesson;
  }

  const baseId = moduleId.replace(/-[23]$/, '');
  const moduleNumber = MODULE_NUMBERS[baseId];
  const fileName = TIER_FILES[tier];
  if (!moduleNumber || !fileName) return null;

  // Try backend API first (reads from lessons_formatted)
  try {
    const fromApi = await request<LessonContent>(
      `/lessons/${tier}/${encodeURIComponent(moduleId)}`
    );
    if (fromApi?.markdown) return fromApi;
  } catch {
    // API failed, try static file from public
  }

  // Bundled fallback: use the markdown imported into the frontend build.
  const bundledLesson = getSpiralLessonContent(moduleId, tier);
  if (bundledLesson) {
    return bundledLesson;
  }

  // Fallback: fetch from public/lessons_formatted
  try {
    const res = await fetchWithTimeout(`/lessons_formatted/${fileName}`);
    if (!res.ok) throw new Error('Fetch failed');
    const content = await res.text();
    const normalized = normalizeLessonMarkdown(content);
    const section = extractModuleSection(normalized, moduleNumber);
    if (!section) return null;
    return { markdown: section, tier, moduleNumber };
  } catch {
    return null;
  }
}
