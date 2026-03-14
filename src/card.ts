import { CARD_WIDTH_PX, getExportDimensions } from './constants'
import { getIconUrl, type IconId } from './icons'
import { getCardLayout } from './layout'

export interface CardOptions {
  iconId: IconId | null
  line1: string
  line2: string
  line3: string
  showLine2?: boolean
  showLine3?: boolean
  showBorder?: boolean
  /** Export resolution (DPI). Default 300. */
  exportDpi?: number
  /** Hex colors for icon and each text line (e.g. #000000). */
  iconColor?: string
  line1Color?: string
  line2Color?: string
  line3Color?: string
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

/** Set SVG fill and stroke to a given hex color. */
function svgToColor(svg: string, color: string): string {
  const hex = color.startsWith('#') ? color : `#${color}`
  return svg
    .replace(/\bfill="[^"]*"/gi, `fill="${hex}"`)
    .replace(/\bstroke="[^"]*"/gi, `stroke="${hex}"`)
}

/** Fetch SVG from URL and load as Image (avoids canvas taint). Icon uses given color. */
async function loadSvgFromUrl(url: string, color: string): Promise<HTMLImageElement> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch icon: ${res.status}`)
  let svgText = await res.text()
  svgText = svgToColor(svgText, color)
  return loadSvgAsImage(svgText)
}

/** Force the label font to load so canvas can use it (browsers don't load @font-face until used in DOM). */
async function waitForFonts(): Promise<void> {
  if (!document.fonts?.load) return
  await document.fonts.load('700 1em "Beleren2016 Small Caps"')
  await document.fonts.ready
}

const fontSize = 84
const textFontFamily = '"Beleren2016 Small Caps", serif'

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

  const iconColor = options.iconColor ?? '#000000'
  if (hasIcon && options.iconId) {
    const url = getIconUrl(options.iconId as IconId)
    const img = await loadSvgFromUrl(url, iconColor)
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

  const lineColors = [
    options.line1Color ?? '#000000',
    options.line2Color ?? '#000000',
    options.line3Color ?? '#000000',
  ]
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const fs = fontSize * s
  ctx.font = `600 ${fs}px ${textFontFamily}`

  let lineY = y
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (lineY + layout.lineHeight > textAreaBottom) break
    ctx.fillStyle = lineColors[i] ?? '#000000'
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

  if (options.showBorder) {
    const borderWidth = Math.max(1, 3 * s)
    const half = borderWidth / 2
    ctx.strokeStyle = '#000'
    ctx.lineWidth = borderWidth
    ctx.strokeRect(half, half, width - borderWidth, height - borderWidth)
  }
}

/** Create an offscreen canvas, draw the card, return as PNG blob. */
export async function renderCardToBlob(options: CardOptions): Promise<Blob> {
  const dpi = options.exportDpi ?? 300
  const { width, height } = getExportDimensions(dpi)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2d not available')
  const scale = width / CARD_WIDTH_PX
  await drawCard(ctx, width, height, options, scale)
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
