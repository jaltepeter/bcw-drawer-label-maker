import { describe, it, expect } from 'vitest'
import {
  CARD_WIDTH_PX,
  CARD_HEIGHT_PX,
  DPI,
  CARD_WIDTH_IN,
  CARD_HEIGHT_IN,
} from './constants'

describe('constants', () => {
  it('card dimensions match MTG size at 300 DPI', () => {
    expect(CARD_WIDTH_PX).toBe(750)
    expect(CARD_HEIGHT_PX).toBe(1050)
    expect(DPI).toBe(300)
  })

  it('pixel dimensions match inches × DPI', () => {
    expect(CARD_WIDTH_PX).toBe(CARD_WIDTH_IN * DPI)
    expect(CARD_HEIGHT_PX).toBe(CARD_HEIGHT_IN * DPI)
  })

  it('aspect ratio matches MTG card (2.5 : 3.5)', () => {
    const ratio = CARD_WIDTH_PX / CARD_HEIGHT_PX
    expect(ratio).toBeCloseTo(2.5 / 3.5, 5)
  })
})
