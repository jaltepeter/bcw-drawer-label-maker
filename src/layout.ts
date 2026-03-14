import { CARD_WIDTH_IN, CARD_HEIGHT_IN, MAX_ICON_SIZE_IN, ICON_BOTTOM_MARGIN_IN } from './constants'

/**
 * Pure layout math for the card. Used by card.ts and by tests.
 * Icon: square, bottom edge at ICON_BOTTOM_MARGIN_IN from card bottom; size capped at MAX_ICON_SIZE_IN.
 * Text: below icon with padding.
 */
const REFERENCE_WIDTH = 804
const PADDING = 60
/** Top/bottom inset for icon zone; extra top room so symbol font doesn’t bleed. */
const ICON_PADDING_TOP = 56
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
  // Bottom of icon sits ICON_BOTTOM_MARGIN_IN from bottom of card
  const iconBottomY = height - ICON_BOTTOM_MARGIN_IN * (height / CARD_HEIGHT_IN)
  const maxIconHeight = iconBottomY - iconPaddingTop
  const maxIconPx = (width / CARD_WIDTH_IN) * MAX_ICON_SIZE_IN
  const iconSize = Math.min(
    width - 2 * padding,
    maxIconHeight,
    maxIconPx
  )
  const iconX = (width - iconSize) / 2
  const iconY = iconBottomY - iconSize
  const textStartY = iconBottomY + padding
  const contentWidth = width - 2 * padding
  return {
    iconZoneHeight: iconBottomY,
    iconSize,
    iconX,
    iconY,
    textStartY,
    contentWidth,
    lineHeight: LINE_HEIGHT * scale,
    padding,
  }
}
