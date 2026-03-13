import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderCardToBlob, downloadCard } from './card'
import type { CardOptions } from './card'
import { CARD_WIDTH_PX } from './constants'

function makeMockCanvas(): HTMLCanvasElement {
  const mockToBlob = vi.fn((callback: (blob: Blob) => void) => {
    callback(new Blob([''], { type: 'image/png' }))
  })
  const mockCtx = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
    font: '',
    fillStyle: '',
    textAlign: '',
    textBaseline: '',
  }
  return {
    width: CARD_WIDTH_PX,
    height: 1050,
    getContext: vi.fn((_: string) => mockCtx),
    toBlob: mockToBlob,
  } as unknown as HTMLCanvasElement
}

describe('renderCardToBlob', () => {
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    const mockCanvas = makeMockCanvas()
    originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName.toLowerCase() === 'canvas') return mockCanvas
      return originalCreateElement(tagName as keyof HTMLElementTagNameMap)
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a PNG blob when no icon (text only)', async () => {
    const options: CardOptions = {
      iconId: null,
      line1: 'Test',
      line2: '',
      line3: '',
    }
    const blob = await renderCardToBlob(options)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('image/png')
    expect(blob.size).toBeGreaterThanOrEqual(0)
  })

  it('works with three lines of text', async () => {
    const options: CardOptions = {
      iconId: null,
      line1: 'Line 1',
      line2: 'Line 2',
      line3: 'Line 3',
    }
    const blob = await renderCardToBlob(options)
    expect(blob.type).toBe('image/png')
  })
})

describe('downloadCard', () => {
  it('creates a link and triggers download without throwing', () => {
    const blob = new Blob([''], { type: 'image/png' })
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    expect(() => downloadCard(blob, 'test-label.png')).not.toThrow()

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock')

    clickSpy.mockRestore()
    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
  })
})
