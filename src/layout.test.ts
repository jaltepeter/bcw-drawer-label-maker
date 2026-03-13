import { describe, it, expect } from 'vitest'
import { getCardLayout } from './layout'
import { CARD_WIDTH_PX, CARD_HEIGHT_PX } from './constants'

describe('getCardLayout', () => {
  it('returns layout for full-size card', () => {
    const layout = getCardLayout(CARD_WIDTH_PX, CARD_HEIGHT_PX)
    expect(layout.iconZoneHeight).toBe(CARD_HEIGHT_PX * (2 / 3))
    expect(layout.textStartY).toBeGreaterThan(layout.iconZoneHeight)
    expect(layout.iconSize).toBeGreaterThan(0)
    expect(layout.iconX).toBeGreaterThanOrEqual(0)
    expect(layout.iconY).toBeGreaterThanOrEqual(0)
    expect(layout.contentWidth).toBe(CARD_WIDTH_PX - 2 * layout.padding)
    expect(layout.lineHeight).toBeGreaterThan(0)
  })

  it('icon zone is top 2/3 of card height', () => {
    const layout = getCardLayout(CARD_WIDTH_PX, CARD_HEIGHT_PX)
    expect(layout.iconZoneHeight).toBe(700)
  })

  it('three lines of text fit in bottom third', () => {
    const layout = getCardLayout(CARD_WIDTH_PX, CARD_HEIGHT_PX)
    const textAreaHeight = CARD_HEIGHT_PX - layout.textStartY - layout.padding
    const threeLinesHeight = layout.lineHeight * 3
    expect(threeLinesHeight).toBeLessThanOrEqual(textAreaHeight)
  })

  it('scales layout for smaller canvas (preview size)', () => {
    const w = 225
    const h = 315
    const layout = getCardLayout(w, h)
    expect(layout.iconZoneHeight).toBe(h * (2 / 3))
    expect(layout.iconSize).toBeLessThanOrEqual(w)
    expect(layout.iconX + layout.iconSize).toBeLessThanOrEqual(w)
    expect(layout.contentWidth).toBeLessThanOrEqual(w)
    expect(layout.padding).toBeLessThan(60)
    expect(layout.lineHeight).toBeLessThan(86)
  })
})
