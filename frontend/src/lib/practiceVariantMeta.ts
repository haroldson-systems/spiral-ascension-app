import type { PracticeVariant } from '@/data/practices';

const SORT_DATE_TAG_PREFIX = 'sort-date:';

const MONTH_MAP: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

export function stripMetaTags(tags?: string[]) {
  return (tags ?? []).filter((tag) => !tag.startsWith(SORT_DATE_TAG_PREFIX));
}

export function extractSortDateFromTags(tags?: string[]) {
  const raw = (tags ?? []).find((tag) => tag.startsWith(SORT_DATE_TAG_PREFIX));
  return raw ? raw.slice(SORT_DATE_TAG_PREFIX.length).trim() || undefined : undefined;
}

export function mergeTagsWithSortDate(tags: string[] | undefined, sortDate?: string) {
  const cleanedTags = stripMetaTags(tags);
  const normalizedSortDate = sortDate?.trim();
  return normalizedSortDate
    ? [...cleanedTags, `${SORT_DATE_TAG_PREFIX}${normalizedSortDate}`]
    : cleanedTags;
}

function parseTimestamp(value?: string) {
  if (!value) return Number.NaN;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? Number.NaN : timestamp;
}

function parseDateFromTitle(title: string) {
  const match = title.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!match) return Number.NaN;

  const [, day, monthRaw, year] = match;
  const month = MONTH_MAP[monthRaw.toLowerCase()];
  if (month == null) return Number.NaN;

  return new Date(Number(year), month, Number(day)).getTime();
}

function parseDateFromId(id: string) {
  const match = id.match(/-(\d{4})-(\d{2})-(\d{2})(?:-|$)/);
  if (!match) return Number.NaN;

  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
}

export function resolveVariantSortDate(variant: PracticeVariant) {
  return variant.sortDate?.trim()
    || extractSortDateFromTags(variant.tags)
    || undefined;
}

export function compareVariantSortDateDesc(a: PracticeVariant, b: PracticeVariant) {
  const aTimestamp =
    parseTimestamp(resolveVariantSortDate(a))
    || parseDateFromTitle(a.title)
    || parseDateFromId(a.id)
    || Number.NEGATIVE_INFINITY;
  const bTimestamp =
    parseTimestamp(resolveVariantSortDate(b))
    || parseDateFromTitle(b.title)
    || parseDateFromId(b.id)
    || Number.NEGATIVE_INFINITY;

  if (aTimestamp !== bTimestamp) {
    return bTimestamp - aTimestamp;
  }

  return a.title.localeCompare(b.title);
}
