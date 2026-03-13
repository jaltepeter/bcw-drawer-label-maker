import { describe, it, expect } from 'vitest'
import { ICONS, ICON_IDS, getIconUrl } from './icons'
import type { IconId } from './icons'

const MANA_CDN = 'https://cdn.jsdelivr.net/gh/andrewgioia/mana@master/svg'

describe('icons', () => {
  it('ICON_IDS is non-empty', () => {
    expect(ICON_IDS.length).toBeGreaterThan(0)
  })

  it('every ICON_IDS entry has a URL in ICONS', () => {
    for (const id of ICON_IDS) {
      expect(ICONS[id]).toBeDefined()
      expect(ICONS[id]).toMatch(/^https:\/\//)
      expect(ICONS[id].endsWith(`${id}.svg`)).toBe(true)
    }
  })

  it('getIconUrl returns CDN URL for each icon', () => {
    expect(getIconUrl('w' as IconId)).toBe(`${MANA_CDN}/w.svg`)
    expect(getIconUrl('u' as IconId)).toBe(`${MANA_CDN}/u.svg`)
  })

  it('ICONS has no extra keys beyond ICON_IDS', () => {
    const iconKeys = new Set(Object.keys(ICONS))
    const idsSet = new Set(ICON_IDS)
    for (const key of iconKeys) {
      expect(idsSet.has(key)).toBe(true)
    }
  })
})
