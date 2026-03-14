import { describe, it, expect } from 'vitest'
import {
  CARD_WIDTH_PX,
  CARD_HEIGHT_PX,
  DPI,
  CARD_WIDTH_IN,
  CARD_HEIGHT_IN,
  getExportDimensions,
  EXPORT_DPI_OPTIONS,
} from './constants'

describe('constants', () => {
  it('card dimensions match toploader insert size at 300 DPI', () => {
    expect(CARD_WIDTH_PX).toBe(804)
    expect(CARD_HEIGHT_PX).toBe(1074)
    expect(DPI).toBe(300)
  })

  it('pixel dimensions match inches × DPI', () => {
    expect(CARD_WIDTH_PX).toBe(Math.round(CARD_WIDTH_IN * DPI))
    expect(CARD_HEIGHT_PX).toBe(Math.round(CARD_HEIGHT_IN * DPI))
  })

  it('aspect ratio matches card size (2.68 : 3.58)', () => {
    const ratio = CARD_WIDTH_PX / CARD_HEIGHT_PX
    expect(ratio).toBeCloseTo(2.68 / 3.58, 5)
  })

  it('getExportDimensions returns correct pixel size for DPI', () => {
    expect(getExportDimensions(300)).toEqual({ width: 804, height: 1074 })
    expect(getExportDimensions(600)).toEqual({ width: 1608, height: 2148 })
  })

  it('EXPORT_DPI_OPTIONS includes 300 and 600', () => {
    expect(EXPORT_DPI_OPTIONS).toContain(300)
    expect(EXPORT_DPI_OPTIONS).toContain(600)
  })
})
