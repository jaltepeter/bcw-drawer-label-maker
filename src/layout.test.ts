import { describe, it, expect } from 'vitest'
import { getCardLayout } from './layout'
import { CARD_WIDTH_PX, CARD_HEIGHT_PX, CARD_HEIGHT_IN, ICON_BOTTOM_MARGIN_IN } from './constants'

describe('getCardLayout', () => {
  it('returns layout for full-size card', () => {
    const layout = getCardLayout(CARD_WIDTH_PX, CARD_HEIGHT_PX)
    const iconBottomY = CARD_HEIGHT_PX - ICON_BOTTOM_MARGIN_IN * (CARD_HEIGHT_PX / CARD_HEIGHT_IN)
    expect(layout.iconZoneHeight).toBe(iconBottomY)
    expect(layout.textStartY).toBeGreaterThan(layout.iconZoneHeight)
    expect(layout.iconSize).toBeGreaterThan(0)
    expect(layout.iconX).toBeGreaterThanOrEqual(0)
    expect(layout.iconY).toBeGreaterThanOrEqual(0)
    expect(layout.contentWidth).toBe(CARD_WIDTH_PX - 2 * layout.padding)
    expect(layout.lineHeight).toBeGreaterThan(0)
  })

  it('icon bottom is ICON_BOTTOM_MARGIN_IN from card bottom', () => {
    const layout = getCardLayout(CARD_WIDTH_PX, CARD_HEIGHT_PX)
    const iconBottomY = CARD_HEIGHT_PX - ICON_BOTTOM_MARGIN_IN * (CARD_HEIGHT_PX / CARD_HEIGHT_IN)
    expect(layout.iconZoneHeight).toBe(iconBottomY)
    expect(layout.iconY + layout.iconSize).toBe(iconBottomY)
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
    const iconBottomY = h - ICON_BOTTOM_MARGIN_IN * (h / CARD_HEIGHT_IN)
    expect(layout.iconZoneHeight).toBe(iconBottomY)
    expect(layout.iconSize).toBeLessThanOrEqual(w)
    expect(layout.iconX + layout.iconSize).toBeLessThanOrEqual(w)
    expect(layout.contentWidth).toBeLessThanOrEqual(w)
    expect(layout.padding).toBeLessThan(60)
    expect(layout.lineHeight).toBeLessThan(86)
  })
})
