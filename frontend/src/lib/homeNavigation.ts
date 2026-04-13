export const HOME_SECTION_IDS = {
  spiral: 'spiral-section',
  vault: 'vault-section',
  practices: 'practice-section',
  moonsync: 'moonsync-section',
} as const;

export type HomeSectionKey = keyof typeof HOME_SECTION_IDS;

export function homeSectionHref(section: HomeSectionKey) {
  return `/#${HOME_SECTION_IDS[section]}`;
}
