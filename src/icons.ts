/**
 * Mana and ability symbols from Mana (https://github.com/andrewgioia/mana).
 * SVGs are loaded from jsDelivr CDN. IDs match repo filenames without .svg.
 */
const MANA_CDN = 'https://cdn.jsdelivr.net/gh/andrewgioia/mana@master/svg'

/** The 5 color mana symbols plus colorless and color pie. */
const SYMBOL_IDS = ['w', 'u', 'b', 'r', 'g', 'c', 'watermark-colorpie'] as const

export type IconId = (typeof SYMBOL_IDS)[number]
export const ICON_IDS = [...SYMBOL_IDS]

/** URL for a mana/ability symbol SVG (filename without .svg). */
export function getIconUrl(id: IconId): string {
  return `${MANA_CDN}/${id}.svg`
}

/** For tests: ICONS[id] is the URL. */
export const ICONS: Record<string, string> = Object.fromEntries(
  ICON_IDS.map((id) => [id, getIconUrl(id)])
)
