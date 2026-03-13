/**
 * Pure layout math for the card. Used by card.ts and by tests.
 * Card: top 2/3 = icon, bottom 1/3 = text (with padding).
 * All dimensions scale with canvas size (reference: 750px width).
 */
const REFERENCE_WIDTH = 750
const PADDING = 60
/** Top/bottom inset for icon zone; extra top room so symbol font doesn’t bleed. */
const ICON_PADDING_TOP = 56
const ICON_PADDING_BOTTOM = 40
const LINE_HEIGHT = 86

export interface CardLayout {
  iconZoneHeight: number
  iconSize: number
  iconX: number
  iconY: number
  textStartY: number
  contentWidth: number
  lineHeight: number
  padding: number
}

export function getCardLayout(width: number, height: number): CardLayout {
  const scale = width / REFERENCE_WIDTH
  const padding = PADDING * scale
  const iconPaddingTop = ICON_PADDING_TOP * scale
  const iconPaddingBottom = ICON_PADDING_BOTTOM * scale
  const iconZoneHeight = height * (2 / 3)
  const iconSize = Math.min(
    width - 2 * padding,
    iconZoneHeight - iconPaddingTop - iconPaddingBottom
  )
  const iconX = (width - iconSize) / 2
  const iconY = iconPaddingTop
  const textStartY = iconZoneHeight + padding * 0.5
  const contentWidth = width - 2 * padding
  return {
    iconZoneHeight,
    iconSize,
    iconX,
    iconY,
    textStartY,
    contentWidth,
    lineHeight: LINE_HEIGHT * scale,
    padding,
  }
}
