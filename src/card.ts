import { CARD_WIDTH_PX, CARD_HEIGHT_PX } from './constants'
import { getIconUrl, type IconId } from './icons'
import { getCardLayout } from './layout'

export interface CardOptions {
  iconId: IconId | null
  line1: string
  line2: string
  line3: string
  showLine2?: boolean
  showLine3?: boolean
}

/** Load an SVG string as an Image for drawing on canvas. */
function loadSvgAsImage(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load SVG'))
    }
    img.src = url
  })
}

/** Force SVG to render in black (for card output). */
function svgToBlack(svg: string): string {
  return svg
    .replace(/\bfill="[^"]*"/gi, 'fill="#000"')
    .replace(/\bstroke="[^"]*"/gi, 'stroke="#000"')
}

/** Fetch SVG from URL and load as Image (avoids canvas taint). Icons are forced to black. */
async function loadSvgFromUrl(url: string): Promise<HTMLImageElement> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch icon: ${res.status}`)
  let svgText = await res.text()
  svgText = svgToBlack(svgText)
  return loadSvgAsImage(svgText)
}

/** Wait for MTG text font (Mplantin) to be loaded. */
function waitForFonts(): Promise<void> {
  if (document.fonts?.ready) return document.fonts.ready.then(() => {})
  return Promise.resolve()
}

const fontSize = 84
const textFontFamily = 'Mplantin, serif'

/** Draw card layout into a context (for preview or export). Scale 1 = 750×1050. */
async function drawCard(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: CardOptions,
  scale: number
) {
  await waitForFonts()
  const s = scale
  const layout = getCardLayout(width, height)
  ctx.clearRect(0, 0, width, height)
  const contentWidth = layout.contentWidth
  const show2 = options.showLine2 !== false
  const show3 = options.showLine3 !== false
  const lines = [
    options.line1,
    show2 ? options.line2 : null,
    show3 ? options.line3 : null,
  ].filter(Boolean) as string[]
  const hasIcon = options.iconId && getIconUrl(options.iconId as IconId)

  if (hasIcon && options.iconId) {
    const url = getIconUrl(options.iconId as IconId)
    const img = await loadSvgFromUrl(url)
    ctx.drawImage(
      img,
      layout.iconX,
      layout.iconY,
      layout.iconSize,
      layout.iconSize
    )
  }

  const textAreaTop = layout.textStartY
  const textAreaBottom = height - layout.padding
  const textAreaHeight = textAreaBottom - textAreaTop
  const blockHeight = lines.length * layout.lineHeight
  const y = textAreaTop + (textAreaHeight - blockHeight) / 2

  ctx.fillStyle = '#000'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const fs = fontSize * s
  ctx.font = `600 ${fs}px ${textFontFamily}`

  let lineY = y
  for (const line of lines) {
    if (lineY + layout.lineHeight > textAreaBottom) break
    let font = fs
    let metrics = ctx.measureText(line)
    while (metrics.width > contentWidth && font > 16) {
      font -= 2
      ctx.font = `600 ${font}px ${textFontFamily}`
      metrics = ctx.measureText(line)
    }
    ctx.fillText(line, width / 2, lineY, contentWidth)
    lineY += layout.lineHeight
  }
}

/** Create an offscreen canvas, draw the card, return as PNG blob (300 DPI export). */
export async function renderCardToBlob(options: CardOptions): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH_PX
  canvas.height = CARD_HEIGHT_PX
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d not available')
  const scale = 1
  await drawCard(ctx, CARD_WIDTH_PX, CARD_HEIGHT_PX, options, scale)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))),
      'image/png',
      1
    )
  })
}

/** Draw preview into an existing canvas (e.g. 225×315). */
export async function drawCardPreview(
  canvas: HTMLCanvasElement,
  options: CardOptions
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const scale = canvas.width / CARD_WIDTH_PX
  await drawCard(ctx, canvas.width, canvas.height, options, scale)
}

/** Trigger download of the card as a PNG file. */
export function downloadCard(blob: Blob, filename = 'drawer-label.png') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
